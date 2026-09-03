BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- DATOS DEL COMPRADOR EN VENTAS
--
-- Los datos pertenecen a la VENTA, no al producto.
-- El modal "Producto temporal" será quien los solicite.
--
-- Compatibilidad:
-- - Se mantiene cys_create_sale(jsonb, text, integer).
-- - Se agrega una sobrecarga de 5 parámetros para el frontend
--   nuevo, evitando romper clientes anteriores durante deploy.
-- ============================================================


-- ============================================================
-- 1. COLUMNAS EN SALES
-- ============================================================

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_name text NULL,
  ADD COLUMN IF NOT EXISTS customer_phone text NULL;


-- ============================================================
-- 2. RESTRICCIONES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_customer_name_valid'
      AND conrelid = 'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_customer_name_valid
      CHECK (
        customer_name IS NULL
        OR (
          BTRIM(customer_name) <> ''
          AND CHAR_LENGTH(BTRIM(customer_name)) <= 120
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
    WHERE conname = 'sales_customer_phone_valid'
      AND conrelid = 'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_customer_phone_valid
      CHECK (
        customer_phone IS NULL
        OR (
          BTRIM(customer_phone) <> ''
          AND CHAR_LENGTH(BTRIM(customer_phone)) <= 30
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
    WHERE conname = 'sales_customer_contact_complete'
      AND conrelid = 'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_customer_contact_complete
      CHECK (
        (
          customer_name IS NULL
          AND customer_phone IS NULL
        )
        OR
        (
          customer_name IS NOT NULL
          AND customer_phone IS NOT NULL
        )
      );
  END IF;
END;
$$;


-- ============================================================
-- 3. CREAR VENTA CON CONTACTO
--
-- La función original de 3 argumentos se mantiene intacta.
-- Esta versión:
--   1) valida el contacto,
--   2) crea la venta con la función existente,
--   3) guarda el contacto,
--   4) todo dentro de la misma transacción.
--
-- Para Producto temporal, nombre y teléfono son obligatorios.
-- Para ventas normales pueden quedar NULL.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cys_create_sale(
  p_items jsonb,
  p_payment_method text,
  p_installments integer,
  p_customer_name text,
  p_customer_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sale jsonb;
  v_sale_id bigint;

  v_customer_name text :=
    NULLIF(
      BTRIM(
        COALESCE(
          p_customer_name,
          ''
        )
      ),
      ''
    );

  v_customer_phone text :=
    NULLIF(
      BTRIM(
        COALESCE(
          p_customer_phone,
          ''
        )
      ),
      ''
    );

  v_has_temporary boolean := false;
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
  -- VALIDAR ITEMS PARA DETECTAR PRODUCTOS TEMPORALES
  -- ----------------------------------------------------------

  IF
    p_items IS NULL
    OR jsonb_typeof(p_items) <> 'array'
  THEN
    RAISE EXCEPTION
      'Los productos de la venta no son válidos.'
      USING ERRCODE = '22023';
  END IF;


  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      p_items
    ) AS item
    WHERE
      COALESCE(
        item ->> 'type',
        'inventory'
      ) = 'temporary'
  )
  INTO v_has_temporary;


  -- ----------------------------------------------------------
  -- VALIDAR CONTACTO
  -- ----------------------------------------------------------

  IF
    (
      v_customer_name IS NULL
      AND v_customer_phone IS NOT NULL
    )
    OR
    (
      v_customer_name IS NOT NULL
      AND v_customer_phone IS NULL
    )
  THEN
    RAISE EXCEPTION
      'Debes ingresar nombre y teléfono del comprador.'
      USING ERRCODE = '22023';
  END IF;


  IF
    v_has_temporary
    AND (
      v_customer_name IS NULL
      OR v_customer_phone IS NULL
    )
  THEN
    RAISE EXCEPTION
      'Los productos temporales requieren nombre y teléfono del comprador.'
      USING ERRCODE = '22023';
  END IF;


  IF
    v_customer_name IS NOT NULL
    AND CHAR_LENGTH(
      v_customer_name
    ) > 120
  THEN
    RAISE EXCEPTION
      'El nombre del comprador no puede superar 120 caracteres.'
      USING ERRCODE = '22023';
  END IF;


  IF
    v_customer_phone IS NOT NULL
    AND (
      CHAR_LENGTH(
        v_customer_phone
      ) < 6
      OR CHAR_LENGTH(
        v_customer_phone
      ) > 30
    )
  THEN
    RAISE EXCEPTION
      'El teléfono del comprador no es válido.'
      USING ERRCODE = '22023';
  END IF;


  -- ----------------------------------------------------------
  -- CREAR VENTA USANDO LA FUNCIÓN YA PROBADA
  -- ----------------------------------------------------------

  v_sale :=
    public.cys_create_sale(
      p_items,
      p_payment_method,
      p_installments
    );


  v_sale_id :=
    NULLIF(
      v_sale ->> 'id',
      ''
    )::bigint;


  IF v_sale_id IS NULL THEN
    RAISE EXCEPTION
      'No fue posible identificar la venta creada.'
      USING ERRCODE = 'P0001';
  END IF;


  -- ----------------------------------------------------------
  -- GUARDAR CONTACTO
  -- ----------------------------------------------------------

  UPDATE public.sales
  SET
    customer_name =
      v_customer_name,

    customer_phone =
      v_customer_phone

  WHERE
    id = v_sale_id;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'No fue posible asociar el comprador a la venta.'
      USING ERRCODE = 'P0001';
  END IF;


  -- ----------------------------------------------------------
  -- DEVOLVER VENTA + COMPRADOR
  -- ----------------------------------------------------------

  RETURN
    v_sale ||
    jsonb_build_object(
      'customerName',
        v_customer_name,

      'customerPhone',
        v_customer_phone
    );

END;
$$;


-- ============================================================
-- 4. LISTAR VENTAS CON CONTACTO
--
-- Se envuelve cys_list_sales() para no duplicar ni modificar
-- su lógica de permisos, productos temporales, pagos, etc.
-- Estadísticas sigue usando cys_list_sales_range() sin PII.
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_list_sales_with_customer()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sales jsonb;
  v_result jsonb;
BEGIN

  -- cys_list_sales() conserva la autorización existente.
  v_sales :=
    public.cys_list_sales();


  SELECT
    COALESCE(
      jsonb_agg(
        sale_data ||
        jsonb_build_object(
          'customerName',
            s.customer_name,

          'customerPhone',
            s.customer_phone
        )
        ORDER BY
          (
            sale_data ->> 'soldAt'
          )::timestamptz DESC,
          (
            sale_data ->> 'id'
          )::bigint DESC
      ),
      '[]'::jsonb
    )
  INTO v_result

  FROM
    jsonb_array_elements(
      COALESCE(
        v_sales,
        '[]'::jsonb
      )
    ) AS sales_rows(sale_data)

  LEFT JOIN
    public.sales s
      ON s.id =
        (
          sale_data ->> 'id'
        )::bigint;


  RETURN v_result;

END;
$$;


-- ============================================================
-- 5. PERMISOS
-- ============================================================

REVOKE ALL
ON FUNCTION public.cys_create_sale(
  jsonb,
  text,
  integer,
  text,
  text
)
FROM
  PUBLIC,
  anon,
  authenticated;


GRANT EXECUTE
ON FUNCTION public.cys_create_sale(
  jsonb,
  text,
  integer,
  text,
  text
)
TO
  authenticated,
  service_role;


REVOKE ALL
ON FUNCTION
  public.cys_list_sales_with_customer()
FROM
  PUBLIC,
  anon,
  authenticated;


GRANT EXECUTE
ON FUNCTION
  public.cys_list_sales_with_customer()
TO
  authenticated,
  service_role;


COMMIT;
