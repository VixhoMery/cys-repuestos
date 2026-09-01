BEGIN;

-- C&S Repuestos
-- Evita categorías duplicadas que solo difieran por:
-- - mayúsculas/minúsculas
-- - espacios al inicio/final
-- - tildes en vocales
--
-- Ejemplos considerados iguales:
--   Suspensión / Suspension / SUSPENSIÓN / " suspension "
--
-- La Ñ se mantiene distinta de N.

CREATE OR REPLACE FUNCTION public.cys_normalize_category_name(
  p_name text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT LOWER(
    TRANSLATE(
      BTRIM(COALESCE(p_name, '')),
      'áéíóúÁÉÍÓÚ',
      'aeiouAEIOU'
    )
  );
$$;

REVOKE ALL
ON FUNCTION public.cys_normalize_category_name(text)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.cys_normalize_category_name(text)
TO authenticated, service_role;

CREATE UNIQUE INDEX IF NOT EXISTS
  categories_normalized_name_unique
ON public.categories (
  public.cys_normalize_category_name(name)
);

COMMIT;
