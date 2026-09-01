BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- Roles, permisos y destinatarios de reporte mensual
--
-- Esta migración PREPARA el sistema de permisos.
-- Todavía NO reemplaza la autorización de los RPC existentes.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Nuevo tipo de cuenta: staff
-- ------------------------------------------------------------

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (
  account_type IN (
    'pending',
    'owner',
    'staff',
    'developer'
  )
);


-- ------------------------------------------------------------
-- 2. Destinatarios del reporte mensual
-- ------------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS receives_monthly_report boolean
NOT NULL
DEFAULT false;


-- Solo owner y administradores pueden quedar configurados
-- como destinatarios del reporte mensual.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_monthly_report_recipient_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_monthly_report_recipient_check
CHECK (
  receives_monthly_report = false
  OR account_type = 'owner'
  OR (
    account_type = 'staff'
    AND role = 'admin'
  )
);


-- ------------------------------------------------------------
-- 3. Helper: usuario activo
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = true
      AND p.account_type IN (
        'owner',
        'staff',
        'developer'
      )
  );
$$;


-- ------------------------------------------------------------
-- 4. Helper: owner
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = true
      AND p.account_type = 'owner'
  );
$$;


-- ------------------------------------------------------------
-- 5. Helper: developer
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_is_developer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = true
      AND p.account_type = 'developer'
  );
$$;


-- ------------------------------------------------------------
-- 6. Helper: rol staff
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_has_role(
  p_role text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = true
      AND p.account_type = 'staff'
      AND p.role = p_role
  );
$$;


-- ------------------------------------------------------------
-- 7. Helper central de permisos
--
-- owner/developer:
--   acceso total técnico/operacional.
--
-- admin:
--   gestión normal del negocio, sin usuarios ni anular ventas.
--
-- vendedor:
--   consulta catálogo + POS.
--
-- bodega:
--   consulta catálogo + funciones específicas de inventario.
--   NO recibe products.update porque ese RPC también permite
--   modificar precios y otros datos comerciales.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_has_permission(
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND OR v_profile.active IS NOT TRUE THEN
    RETURN false;
  END IF;


  -- Developer conserva acceso completo.
  IF v_profile.account_type = 'developer' THEN
    RETURN true;
  END IF;


  -- Owner conserva acceso completo.
  IF v_profile.account_type = 'owner' THEN
    RETURN true;
  END IF;


  -- Pendientes u otros tipos no tienen permisos.
  IF v_profile.account_type <> 'staff' THEN
    RETURN false;
  END IF;


  -- Administrador
  IF v_profile.role = 'admin' THEN
    RETURN p_permission = ANY (
      ARRAY[
        'products.read',
        'products.create',
        'products.update',
        'products.delete',
        'categories.manage',
        'suppliers.manage',
        'sales.create',
        'sales.read',
        'statistics.read'
      ]
    );
  END IF;


  -- Vendedor
  IF v_profile.role = 'vendedor' THEN
    RETURN p_permission = ANY (
      ARRAY[
        'products.read',
        'sales.create'
      ]
    );
  END IF;


  -- Bodega
  IF v_profile.role = 'bodega' THEN
    RETURN p_permission = ANY (
      ARRAY[
        'products.read',
        'inventory.update'
      ]
    );
  END IF;


  RETURN false;
END;
$$;


-- ------------------------------------------------------------
-- 8. Función especial de administración de usuarios
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_can_manage_users()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.cys_is_owner()
    OR public.cys_is_developer();
$$;


-- ------------------------------------------------------------
-- 9. Función especial para anular ventas
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cys_can_void_sales()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.cys_is_owner()
    OR public.cys_is_developer();
$$;


-- ------------------------------------------------------------
-- 10. Seguridad de las funciones
-- ------------------------------------------------------------

REVOKE ALL
ON FUNCTION public.cys_is_active_user()
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_is_owner()
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_is_developer()
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_has_role(text)
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_has_permission(text)
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_can_manage_users()
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.cys_can_void_sales()
FROM PUBLIC, anon;


GRANT EXECUTE
ON FUNCTION public.cys_is_active_user()
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_is_owner()
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_is_developer()
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_has_role(text)
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_has_permission(text)
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_can_manage_users()
TO authenticated, service_role;

GRANT EXECUTE
ON FUNCTION public.cys_can_void_sales()
TO authenticated, service_role;


COMMIT;