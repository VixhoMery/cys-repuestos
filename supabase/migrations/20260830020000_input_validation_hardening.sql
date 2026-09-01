BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- Validaciones de integridad de inputs
-- ============================================================

DO $$
BEGIN

  -- Categorías
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_name_content'
      AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_name_content
      CHECK (
        BTRIM(name) <> ''
        AND CHAR_LENGTH(BTRIM(name)) <= 60
      );
  END IF;


  -- Productos: nombre
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_name_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_name_content
      CHECK (
        BTRIM(name) <> ''
        AND CHAR_LENGTH(BTRIM(name)) <= 100
      );
  END IF;


  -- Productos: marca
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_brand_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_brand_content
      CHECK (
        BTRIM(brand) <> ''
        AND CHAR_LENGTH(BTRIM(brand)) <= 60
      );
  END IF;


  -- Productos: SKU
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_sku_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_sku_content
      CHECK (
        BTRIM(sku) <> ''
        AND CHAR_LENGTH(BTRIM(sku)) <= 50
      );
  END IF;


  -- Productos: categoría
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_category_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_content
      CHECK (
        BTRIM(category) <> ''
        AND CHAR_LENGTH(BTRIM(category)) <= 60
      );
  END IF;


  -- Productos: descripción corta
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_short_description_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_short_description_content
      CHECK (
        BTRIM(short_description) <> ''
        AND CHAR_LENGTH(BTRIM(short_description)) <= 50
      );
  END IF;


  -- Productos: descripción
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_description_content'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_description_content
      CHECK (
        BTRIM(description) <> ''
        AND CHAR_LENGTH(BTRIM(description)) <= 1000
      );
  END IF;


  -- Storage path no puede ser vacío
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_images_storage_path_content'
      AND conrelid = 'public.product_images'::regclass
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_storage_path_content
      CHECK (
        storage_path IS NULL
        OR BTRIM(storage_path) <> ''
      );
  END IF;


  -- URLs externas solo HTTP/HTTPS
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_images_external_url_protocol'
      AND conrelid = 'public.product_images'::regclass
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_external_url_protocol
      CHECK (
        external_url IS NULL
        OR (
          BTRIM(external_url) <> ''
          AND BTRIM(external_url) ~* '^https?://'
        )
      );
  END IF;

END
$$;

COMMIT;