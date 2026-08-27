BEGIN;

-- =========================================================
-- C&S REPUESTOS
-- Base del sistema privado de registro
-- =========================================================


-- ---------------------------------------------------------
-- 1. Tipo de cuenta
-- ---------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type text;


-- Los perfiles que ya existían no se eliminan ni desactivan.
-- Simplemente reciben temporalmente account_type = pending.
UPDATE public.profiles
SET account_type = 'pending'
WHERE account_type IS NULL;


ALTER TABLE public.profiles
ALTER COLUMN account_type SET DEFAULT 'pending';


ALTER TABLE public.profiles
ALTER COLUMN account_type SET NOT NULL;


ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;


ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (
  account_type IN (
    'pending',
    'owner',
    'developer'
  )
);


-- ---------------------------------------------------------
-- 2. Las cuentas NUEVAS nacen desactivadas
-- ---------------------------------------------------------

ALTER TABLE public.profiles
ALTER COLUMN active SET DEFAULT false;


-- ---------------------------------------------------------
-- 3. Crear perfil seguro cuando Supabase crea un usuario
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    account_type,
    active
  )
  VALUES (
    NEW.id,

    COALESCE(
      NULLIF(
        NEW.raw_user_meta_data ->> 'full_name',
        ''
      ),
      NULLIF(
        NEW.raw_user_meta_data ->> 'name',
        ''
      ),
      SPLIT_PART(
        COALESCE(NEW.email, ''),
        '@',
        1
      ),
      ''
    ),

    'vendedor',
    'pending',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

END;
$$;


COMMIT;