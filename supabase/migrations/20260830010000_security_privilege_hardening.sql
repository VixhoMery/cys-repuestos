BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- Security hardening: permisos mínimos de Data API
-- ============================================================


-- ------------------------------------------------------------
-- 1. Tablas internas
--
-- El frontend accede a estas tablas exclusivamente mediante
-- RPC SECURITY DEFINER. anon/authenticated no necesitan
-- acceso directo.
-- ------------------------------------------------------------

REVOKE ALL ON TABLE
  public.products,
  public.categories,
  public.product_images,
  public.suppliers,
  public.sales,
  public.sale_items,
  public.report_deliveries,
  public.cys_registration_attempts
FROM anon, authenticated;


-- ------------------------------------------------------------
-- 2. Profiles
--
-- AuthContext sí necesita leer directamente el perfil del
-- usuario conectado. No necesita INSERT/UPDATE/DELETE.
-- RLS sigue restringiendo el SELECT al propio usuario.
-- ------------------------------------------------------------

REVOKE ALL
ON TABLE public.profiles
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.profiles
TO authenticated;


-- ------------------------------------------------------------
-- 3. Revocar acceso cliente a TODAS las funciones cys_*
--
-- Esto también elimina grants heredados de Supabase.
-- Luego devolvemos solamente los RPC que necesita la app.
-- ------------------------------------------------------------

DO $$
DECLARE
  function_row record;
BEGIN
  FOR function_row IN
    SELECT
      p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE
      n.nspname = 'public'
      AND p.proname LIKE 'cys\_%' ESCAPE '\'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      function_row.signature
    );
  END LOOP;
END
$$;


-- ------------------------------------------------------------
-- 4. RPC permitidas para usuarios autenticados
-- ------------------------------------------------------------

DO $$
DECLARE
  function_row record;
BEGIN
  FOR function_row IN
    SELECT
      p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE
      n.nspname = 'public'
      AND p.proname = ANY(
        ARRAY[
          'cys_is_authorized_user',
          'cys_list_products',
          'cys_get_product',
          'cys_create_product',
          'cys_update_product',
          'cys_replace_product_images',
          'cys_delete_product',
          'cys_list_categories',
          'cys_create_category',
          'cys_delete_category',
          'cys_list_suppliers',
          'cys_create_supplier',
          'cys_delete_supplier',
          'cys_create_sale',
          'cys_list_sales'
        ]
      )
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO authenticated',
      function_row.signature
    );
  END LOOP;
END
$$;


-- ------------------------------------------------------------
-- 5. Funciones estrictamente internas
--
-- Solo Edge Functions / service_role.
-- ------------------------------------------------------------

DO $$
DECLARE
  function_row record;
BEGIN
  FOR function_row IN
    SELECT
      p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE
      n.nspname = 'public'
      AND p.proname = ANY(
        ARRAY[
          'cys_activate_owner_internal',
          'cys_consume_registration_attempt',
          'cys_monthly_report_snapshot'
        ]
      )
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO service_role',
      function_row.signature
    );
  END LOOP;
END
$$;


-- ------------------------------------------------------------
-- 6. Evitar que nuevos objetos vuelvan a nacer abiertos
-- ------------------------------------------------------------

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON TABLES
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS
FROM PUBLIC, anon, authenticated;


COMMIT;