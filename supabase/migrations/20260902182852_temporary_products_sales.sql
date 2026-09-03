BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- PRODUCTOS TEMPORALES EN VENTAS
--
-- Un producto temporal:
-- - existe únicamente dentro de una venta
-- - no se guarda en public.products
-- - no afecta stock
-- - conserva nombre, precios y cantidad vendida
-- ============================================================


-- ============================================================
-- 1. EXTENDER SALE_ITEMS
-- ============================================================

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS
    item_type text
    NOT NULL
    DEFAULT 'inventory';

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS
    net_unit_price integer
    NULL;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS
    unit_price_with_tax integer
    NULL;


-- Un producto temporal no tiene product_id.
-- Si ya era nullable, esta instrucción no causa problema.
ALTER TABLE public.sale_items
  ALTER COLUMN product_id
  DROP NOT NULL;


-- ============================================================
-- 2. CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'sale_items_item_type_valid'
      AND conrelid =
        'public.sale_items'::regclass
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT
        sale_items_item_type_valid
      CHECK (
        item_type IN (
          'inventory',
          'temporary'
        )
      );
  END IF;
END;
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'sale_items_net_unit_price_valid'
      AND conrelid =
        'public.sale_items'::regclass
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT
        sale_items_net_unit_price_valid
      CHECK (
        net_unit_price IS NULL
        OR net_unit_price > 0
      );
  END IF;
END;
$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'sale_items_price_with_tax_valid'
      AND conrelid =
        'public.sale_items'::regclass
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT
        sale_items_price_with_tax_valid
      CHECK (
        unit_price_with_tax IS NULL
        OR unit_price_with_tax > 0
      );
  END IF;
END;
$$;


-- Un temporal debe tener sus datos económicos
-- y jamás estar conectado al inventario.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'sale_items_temporary_fields_valid'
      AND conrelid =
        'public.sale_items'::regclass
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT
        sale_items_temporary_fields_valid
      CHECK (
        item_type <> 'temporary'
        OR (
          product_id IS NULL
          AND net_unit_price IS NOT NULL
          AND unit_price_with_tax IS NOT NULL
        )
      );
  END IF;
END;
$$;


-- ============================================================
-- 3. CREAR VENTA
--
-- Compatibilidad:
-- si un item no trae "type", se considera "inventory".
--
-- Inventory:
-- {
--   "type": "inventory",
--   "productId": 123,
--   "quantity": 2
-- }
--
-- Temporary:
-- {
--   "type": "temporary",
--   "name": "Alternador especial",
--   "netPrice": 80000,
--   "salePrice": 115000,
--   "quantity": 2
-- }
--
-- priceWithTax se calcula SIEMPRE en servidor.
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_create_sale(
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

  v_json_item jsonb;

  v_product record;

  v_item_type text;

  v_name text;

  v_product_id bigint;

  v_quantity integer;

  v_net_price integer;

  v_price_with_tax integer;

  v_sale_price integer;

  v_subtotal bigint;
BEGIN

  -- ----------------------------------------------------------
  -- AUTORIZACIÓN
  -- ----------------------------------------------------------

  IF NOT public.cys_has_permission(
    'sales.create'
  ) THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;


  -- ----------------------------------------------------------
  -- MÉTODO DE PAGO
  -- ----------------------------------------------------------

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


  -- ----------------------------------------------------------
  -- CUOTAS
  -- ----------------------------------------------------------

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


  -- ----------------------------------------------------------
  -- VALIDAR ARRAY
  -- ----------------------------------------------------------

  IF
    p_items IS NULL
    OR
    jsonb_typeof(
      p_items
    ) <> 'array'
    OR
    jsonb_array_length(
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


  -- ==========================================================
  -- 4. VALIDAR TODOS LOS ITEMS ANTES DE CREAR LA VENTA
  -- ==========================================================

  FOR v_json_item IN
    SELECT value
    FROM jsonb_array_elements(
      p_items
    )
  LOOP

    v_item_type :=
      LOWER(
        BTRIM(
          COALESCE(
            NULLIF(
              v_json_item ->> 'type',
              ''
            ),
            'inventory'
          )
        )
      );


    IF
      v_item_type NOT IN (
        'inventory',
        'temporary'
      )
    THEN
      RAISE EXCEPTION
        'La venta contiene un tipo de producto no válido.';
    END IF;


    -- --------------------------------------------------------
    -- PRODUCTO DE INVENTARIO
    -- --------------------------------------------------------

    IF
      v_item_type =
        'inventory'
    THEN

      IF
        COALESCE(
          v_json_item ->> 'productId',
          ''
        ) !~ '^[0-9]+$'
        OR
        COALESCE(
          v_json_item ->> 'quantity',
          ''
        ) !~ '^[0-9]+$'
      THEN
        RAISE EXCEPTION
          'La venta contiene un producto o cantidad no válida.';
      END IF;


      IF
        (
          v_json_item ->>
            'productId'
        )::numeric < 1
        OR
        (
          v_json_item ->>
            'quantity'
        )::numeric < 1
        OR
        (
          v_json_item ->>
            'quantity'
        )::numeric >
          2147483647
      THEN
        RAISE EXCEPTION
          'La venta contiene un producto o cantidad no válida.';
      END IF;


    -- --------------------------------------------------------
    -- PRODUCTO TEMPORAL
    -- --------------------------------------------------------

    ELSE

      v_name :=
        BTRIM(
          COALESCE(
            v_json_item ->>
              'name',
            ''
          )
        );


      IF
        LENGTH(
          v_name
        ) < 1
        OR
        LENGTH(
          v_name
        ) > 100
      THEN
        RAISE EXCEPTION
          'El nombre del producto temporal no es válido.';
      END IF;


      IF
        COALESCE(
          v_json_item ->> 'netPrice',
          ''
        ) !~ '^[0-9]+$'
        OR
        COALESCE(
          v_json_item ->> 'salePrice',
          ''
        ) !~ '^[0-9]+$'
        OR
        COALESCE(
          v_json_item ->> 'quantity',
          ''
        ) !~ '^[0-9]+$'
      THEN
        RAISE EXCEPTION
          'Los valores del producto temporal no son válidos.';
      END IF;


      IF
        (
          v_json_item ->>
            'netPrice'
        )::numeric < 1
        OR
        (
          v_json_item ->>
            'netPrice'
        )::numeric >
          1804608106
        OR
        (
          v_json_item ->>
            'salePrice'
        )::numeric < 1
        OR
        (
          v_json_item ->>
            'salePrice'
        )::numeric >
          2147483647
        OR
        (
          v_json_item ->>
            'quantity'
        )::numeric < 1
        OR
        (
          v_json_item ->>
            'quantity'
        )::numeric >
          2147483647
      THEN
        RAISE EXCEPTION
          'Los valores del producto temporal están fuera del rango permitido.';
      END IF;

    END IF;

  END LOOP;


  -- ==========================================================
  -- 5. PREPARAR PRODUCTOS DE INVENTARIO
  --
  -- Se agrupan IDs repetidos para que no sea posible
  -- superar stock enviando el mismo producto varias veces.
  -- ==========================================================

  FOR v_item IN
    SELECT
      (
        value ->>
          'productId'
      )::bigint
        AS product_id,

      SUM(
        (
          value ->>
            'quantity'
        )::integer
      )::integer
        AS quantity

    FROM
      jsonb_array_elements(
        p_items
      )

    WHERE
      LOWER(
        BTRIM(
          COALESCE(
            NULLIF(
              value ->> 'type',
              ''
            ),
            'inventory'
          )
        )
      ) =
        'inventory'

    GROUP BY
      (
        value ->>
          'productId'
      )::bigint

    ORDER BY
      (
        value ->>
          'productId'
      )::bigint

  LOOP

    v_product_id :=
      v_item.product_id;

    v_quantity :=
      v_item.quantity;


    SELECT
      p.id,
      p.name,
      p.net_price,
      p.price_with_tax,
      p.price,
      p.stock

    INTO
      v_product

    FROM
      public.products p

    WHERE
      p.id =
        v_product_id

    FOR UPDATE;


    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Uno de los productos ya no existe.'
        USING ERRCODE = 'P0002';
    END IF;


    IF
      v_product.stock <
        v_quantity
    THEN
      RAISE EXCEPTION
        'Stock insuficiente para "%". Disponible: %.',
        v_product.name,
        v_product.stock
        USING ERRCODE = 'P0001';
    END IF;


    v_subtotal :=
      v_product.price::bigint *
      v_quantity::bigint;


    v_total :=
      v_total +
      v_subtotal;


    v_prepared :=
      v_prepared ||
      jsonb_build_array(
        jsonb_build_object(
          'itemType',
            'inventory',

          'productId',
            v_product.id::integer,

          'productName',
            v_product.name,

          'netPrice',
            v_product.net_price,

          'priceWithTax',
            v_product.price_with_tax,

          'unitPrice',
            v_product.price,

          'quantity',
            v_quantity,

          'subtotal',
            v_subtotal
        )
      );

  END LOOP;


  -- ==========================================================
  -- 6. PREPARAR PRODUCTOS TEMPORALES
  -- ==========================================================

  FOR v_json_item IN
    SELECT value
    FROM jsonb_array_elements(
      p_items
    )
    WHERE
      LOWER(
        BTRIM(
          COALESCE(
            NULLIF(
              value ->> 'type',
              ''
            ),
            'inventory'
          )
        )
      ) =
        'temporary'

  LOOP

    v_name :=
      BTRIM(
        v_json_item ->>
          'name'
      );


    v_net_price :=
      (
        v_json_item ->>
          'netPrice'
      )::integer;


    v_sale_price :=
      (
        v_json_item ->>
          'salePrice'
      )::integer;


    v_quantity :=
      (
        v_json_item ->>
          'quantity'
      )::integer;


    -- IVA calculado exclusivamente en servidor.
    v_price_with_tax :=
      ROUND(
        v_net_price::numeric *
        1.19
      )::integer;


    v_subtotal :=
      v_sale_price::bigint *
      v_quantity::bigint;


    v_total :=
      v_total +
      v_subtotal;


    v_prepared :=
      v_prepared ||
      jsonb_build_array(
        jsonb_build_object(
          'itemType',
            'temporary',

          'productId',
            NULL,

          'productName',
            v_name,

          'netPrice',
            v_net_price,

          'priceWithTax',
            v_price_with_tax,

          'unitPrice',
            v_sale_price,

          'quantity',
            v_quantity,

          'subtotal',
            v_subtotal
        )
      );

  END LOOP;


  -- ==========================================================
  -- 7. CREAR VENTA
  -- ==========================================================

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


  -- ==========================================================
  -- 8. GUARDAR ITEMS
  -- ==========================================================

  FOR v_json_item IN
    SELECT value
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
      subtotal,
      item_type,
      net_unit_price,
      unit_price_with_tax
    )
    VALUES (
      v_sale_id,

      CASE
        WHEN
          v_json_item ->>
            'productId'
          IS NULL
        THEN NULL
        ELSE
          (
            v_json_item ->>
              'productId'
          )::bigint
      END,

      v_json_item ->>
        'productName',

      (
        v_json_item ->>
          'unitPrice'
      )::bigint,

      (
        v_json_item ->>
          'quantity'
      )::integer,

      (
        v_json_item ->>
          'subtotal'
      )::bigint,

      v_json_item ->>
        'itemType',

      CASE
        WHEN
          v_json_item ->>
            'netPrice'
          IS NULL
        THEN NULL
        ELSE
          (
            v_json_item ->>
              'netPrice'
          )::integer
      END,

      CASE
        WHEN
          v_json_item ->>
            'priceWithTax'
          IS NULL
        THEN NULL
        ELSE
          (
            v_json_item ->>
              'priceWithTax'
          )::integer
      END
    );


    -- Solo inventario modifica stock.
    IF
      v_json_item ->>
        'itemType' =
        'inventory'
    THEN

      UPDATE public.products
      SET
        stock =
          stock -
          (
            v_json_item ->>
              'quantity'
          )::integer,

        updated_at =
          NOW()

      WHERE
        id =
          (
            v_json_item ->>
              'productId'
          )::bigint;

    END IF;

  END LOOP;


  -- ==========================================================
  -- 9. RESPUESTA
  -- ==========================================================

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
-- 10. HISTORIAL DE VENTAS
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

  IF NOT public.cys_has_permission(
    'sales.read'
  ) THEN
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

                  'itemType',
                    si.item_type,

                  'name',
                    si.product_name,

                  'netPrice',
                    si.net_unit_price,

                  'priceWithTax',
                    si.unit_price_with_tax,

                  'quantity',
                    si.quantity,

                  'unitPrice',
                    si.unit_price
                )
                ORDER BY
                  si.id
              )
              FROM
                public.sale_items si
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
  INTO
    v_result
  FROM
    public.sales s;


  RETURN
    v_result;

END;
$$;


-- ============================================================
-- 11. VENTAS POR RANGO / ESTADÍSTICAS
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_list_sales_range(
    p_start timestamptz,
    p_end timestamptz
  )
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN

  IF NOT public.cys_has_permission(
    'statistics.read'
  ) THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;


  IF
    p_start IS NULL
    OR
    p_end IS NULL
    OR
    p_start >= p_end
  THEN
    RAISE EXCEPTION
      'El rango de fechas no es válido.';
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

                  'itemType',
                    si.item_type,

                  'name',
                    si.product_name,

                  'netPrice',
                    si.net_unit_price,

                  'priceWithTax',
                    si.unit_price_with_tax,

                  'quantity',
                    si.quantity,

                  'unitPrice',
                    si.unit_price
                )
                ORDER BY
                  si.id
              )
              FROM
                public.sale_items si
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
  INTO
    v_result

  FROM
    public.sales s

  WHERE
    s.sold_at >=
      p_start

    AND
    s.sold_at <
      p_end;


  RETURN
    v_result;

END;
$$;


-- ============================================================
-- 12. REPORTE MENSUAL
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_monthly_report_snapshot(
    p_reference timestamptz
      DEFAULT NOW()
  )
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_timezone text :=
    'America/Santiago';

  v_reference_local timestamp;

  v_start_local timestamp;

  v_end_local timestamp;

  v_start_utc timestamptz;

  v_end_utc timestamptz;

  v_sales jsonb;
BEGIN

  v_reference_local :=
    timezone(
      v_timezone,
      p_reference
    );


  v_end_local :=
    date_trunc(
      'month',
      v_reference_local
    );


  v_start_local :=
    v_end_local -
    INTERVAL '1 month';


  v_start_utc :=
    v_start_local
      AT TIME ZONE
      v_timezone;


  v_end_utc :=
    v_end_local
      AT TIME ZONE
      v_timezone;


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

                  'itemType',
                    si.item_type,

                  'name',
                    si.product_name,

                  'netPrice',
                    si.net_unit_price,

                  'priceWithTax',
                    si.unit_price_with_tax,

                  'quantity',
                    si.quantity,

                  'unitPrice',
                    si.unit_price,

                  'subtotal',
                    si.subtotal
                )
                ORDER BY
                  si.id
              )
              FROM
                public.sale_items si
              WHERE
                si.sale_id =
                  s.id
            ),
            '[]'::jsonb
          )
      )
      ORDER BY
        s.sold_at ASC,
        s.id ASC
    ),
    '[]'::jsonb
  )
  INTO
    v_sales

  FROM
    public.sales s

  WHERE
    s.sold_at >=
      v_start_utc

    AND
    s.sold_at <
      v_end_utc;


  RETURN jsonb_build_object(
    'periodKey',
      to_char(
        v_start_local,
        'YYYY-MM'
      ),

    'periodStartLocal',
      to_char(
        v_start_local,
        'YYYY-MM-DD'
      ),

    'periodEndLocal',
      to_char(
        v_end_local,
        'YYYY-MM-DD'
      ),

    'timezone',
      v_timezone,

    'sales',
      v_sales
  );

END;
$$;


-- ============================================================
-- 13. PERMISOS
-- ============================================================

REVOKE ALL ON FUNCTION
  public.cys_create_sale(
    jsonb,
    text,
    integer
  )
FROM
  PUBLIC,
  anon;

GRANT EXECUTE ON FUNCTION
  public.cys_create_sale(
    jsonb,
    text,
    integer
  )
TO
  authenticated,
  service_role;


REVOKE ALL ON FUNCTION
  public.cys_list_sales()
FROM
  PUBLIC,
  anon;

GRANT EXECUTE ON FUNCTION
  public.cys_list_sales()
TO
  authenticated,
  service_role;


REVOKE ALL ON FUNCTION
  public.cys_list_sales_range(
    timestamptz,
    timestamptz
  )
FROM
  PUBLIC,
  anon;

GRANT EXECUTE ON FUNCTION
  public.cys_list_sales_range(
    timestamptz,
    timestamptz
  )
TO
  authenticated,
  service_role;


REVOKE ALL ON FUNCTION
  public.cys_monthly_report_snapshot(
    timestamptz
  )
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT EXECUTE ON FUNCTION
  public.cys_monthly_report_snapshot(
    timestamptz
  )
TO
  service_role;


COMMIT;