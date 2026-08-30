BEGIN;

-- ============================================================
-- Cuotas para ventas con tarjeta de crédito
-- ============================================================

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS
    installments integer NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'sales_installments_range'
      AND conrelid =
        'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT
        sales_installments_range
      CHECK (
        installments IS NULL
        OR installments BETWEEN 1 AND 36
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'sales_installments_credit_only'
      AND conrelid =
        'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT
        sales_installments_credit_only
      CHECK (
        installments IS NULL
        OR payment_method = 'credito'
      );
  END IF;
END;
$$;


-- ============================================================
-- Crear venta: crédito exige cuotas
-- ============================================================

DROP FUNCTION IF EXISTS
  public.cys_create_sale(
    jsonb,
    text
  );

CREATE FUNCTION public.cys_create_sale(
  p_items jsonb,
  p_payment_method text,
  p_installments integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid :=
    auth.uid();

  v_email text :=
    auth.jwt() ->> 'email';

  v_payment_method text :=
    LOWER(
      BTRIM(
        COALESCE(
          p_payment_method,
          ''
        )
      )
    );

  v_installments integer :=
    p_installments;

  v_sale_id bigint;
  v_sold_at timestamptz;
  v_total bigint := 0;
  v_prepared jsonb :=
    '[]'::jsonb;
  v_item record;
  v_product record;
  v_subtotal bigint;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF
    v_payment_method NOT IN (
      'efectivo',
      'debito',
      'credito',
      'transferencia',
      'otro'
    )
  THEN
    RAISE EXCEPTION
      'El método de pago no es válido.';
  END IF;

  IF
    v_payment_method =
      'credito'
  THEN
    IF
      v_installments IS NULL
      OR
      v_installments NOT BETWEEN
        1 AND 36
    THEN
      RAISE EXCEPTION
        'Selecciona una cantidad de cuotas válida para el pago con crédito.';
    END IF;
  ELSE
    v_installments := NULL;
  END IF;

  IF
    p_items IS NULL
    OR jsonb_typeof(
      p_items
    ) <> 'array'
    OR jsonb_array_length(
      p_items
    ) < 1
  THEN
    RAISE EXCEPTION
      'La venta debe incluir al menos un producto.';
  END IF;

  IF
    jsonb_array_length(
      p_items
    ) > 100
  THEN
    RAISE EXCEPTION
      'La venta contiene demasiados productos.';
  END IF;

  FOR v_item IN
    SELECT
      (
        value ->> 'productId'
      )::bigint AS product_id,

      SUM(
        (
          value ->> 'quantity'
        )::integer
      )::integer AS quantity

    FROM jsonb_array_elements(
      p_items
    )

    GROUP BY
      (
        value ->> 'productId'
      )::bigint

    ORDER BY
      (
        value ->> 'productId'
      )::bigint
  LOOP
    IF
      v_item.product_id < 1
      OR
      v_item.quantity < 1
    THEN
      RAISE EXCEPTION
        'La venta contiene un producto o cantidad no válida.';
    END IF;

    SELECT
      p.id,
      p.name,
      p.price,
      p.stock
    INTO v_product
    FROM public.products p
    WHERE
      p.id =
        v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Uno de los productos ya no existe.'
        USING ERRCODE = 'P0002';
    END IF;

    IF
      v_product.stock <
      v_item.quantity
    THEN
      RAISE EXCEPTION
        'Stock insuficiente para "%". Disponible: %.',
        v_product.name,
        v_product.stock
        USING ERRCODE = 'P0001';
    END IF;

    v_subtotal :=
      v_product.price::bigint *
      v_item.quantity::bigint;

    v_total :=
      v_total +
      v_subtotal;

    v_prepared :=
      v_prepared ||
      jsonb_build_array(
        jsonb_build_object(
          'productId',
            v_product.id::integer,
          'productName',
            v_product.name,
          'unitPrice',
            v_product.price,
          'quantity',
            v_item.quantity,
          'subtotal',
            v_subtotal
        )
      );
  END LOOP;

  INSERT INTO public.sales (
    seller_id,
    seller_email,
    total_amount,
    payment_method,
    installments
  )
  VALUES (
    v_user_id,
    v_email,
    v_total,
    v_payment_method,
    v_installments
  )
  RETURNING
    id,
    sold_at
  INTO
    v_sale_id,
    v_sold_at;

  FOR v_item IN
    SELECT
      (
        value ->> 'productId'
      )::bigint AS product_id,

      value ->>
        'productName'
        AS product_name,

      (
        value ->> 'unitPrice'
      )::bigint AS unit_price,

      (
        value ->> 'quantity'
      )::integer AS quantity,

      (
        value ->> 'subtotal'
      )::bigint AS subtotal

    FROM jsonb_array_elements(
      v_prepared
    )
  LOOP
    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      subtotal
    )
    VALUES (
      v_sale_id,
      v_item.product_id,
      v_item.product_name,
      v_item.unit_price,
      v_item.quantity,
      v_item.subtotal
    );

    UPDATE public.products
    SET
      stock =
        stock -
        v_item.quantity,
      updated_at =
        NOW()
    WHERE
      id =
        v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'id',
      v_sale_id::integer,
    'sellerId',
      v_user_id,
    'sellerEmail',
      v_email,
    'soldAt',
      v_sold_at,
    'total',
      v_total,
    'paymentMethod',
      v_payment_method,
    'installments',
      v_installments,
    'items',
      v_prepared
  );
END;
$$;


-- ============================================================
-- Historial incluye cuotas
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_list_sales()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',
          s.id::integer,

        'seller',
          COALESCE(
            s.seller_email,
            'Usuario eliminado'
          ),

        'soldAt',
          s.sold_at,

        'total',
          s.total_amount,

        'paymentMethod',
          s.payment_method,

        'installments',
          s.installments,

        'items',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'productId',
                    si.product_id::integer,
                  'name',
                    si.product_name,
                  'quantity',
                    si.quantity,
                  'unitPrice',
                    si.unit_price
                )
                ORDER BY si.id
              )
              FROM public.sale_items si
              WHERE
                si.sale_id =
                  s.id
            ),
            '[]'::jsonb
          )
      )
      ORDER BY
        s.sold_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.sales s;

  RETURN v_result;
END;
$$;


-- ============================================================
-- Permisos
-- ============================================================

REVOKE ALL ON FUNCTION
  public.cys_create_sale(
    jsonb,
    text,
    integer
  )
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.cys_list_sales()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.cys_create_sale(
    jsonb,
    text,
    integer
  )
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.cys_list_sales()
TO authenticated;

COMMIT;
