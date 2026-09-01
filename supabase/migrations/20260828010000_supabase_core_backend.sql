BEGIN;

CREATE OR REPLACE FUNCTION public.cys_is_authorized_user()
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
      AND p.account_type IN ('owner', 'developer')
  );
$$;

REVOKE ALL ON FUNCTION public.cys_is_authorized_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cys_is_authorized_user()
TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cys_list_products(
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 25,
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
  v_offset integer;
  v_total integer;
  v_total_pages integer;
  v_data jsonb;
  v_search text := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_category text := NULLIF(BTRIM(COALESCE(p_category, '')), '');
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  v_offset := (v_page - 1) * v_limit;

  SELECT COUNT(*)::integer
  INTO v_total
  FROM public.products p
  WHERE (
      v_search IS NULL
      OR p.name ILIKE '%' || v_search || '%'
      OR p.brand ILIKE '%' || v_search || '%'
      OR p.sku ILIKE '%' || v_search || '%'
    )
    AND (
      v_category IS NULL
      OR p.category = v_category
    );

  v_total_pages :=
    GREATEST(1, CEIL(v_total::numeric / v_limit)::integer);

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY created_at DESC, id DESC),
    '[]'::jsonb
  )
  INTO v_data
  FROM (
    SELECT
      p.id,
      p.created_at,
      jsonb_build_object(
        'id', p.id::integer,
        'name', p.name,
        'brand', p.brand,
        'sku', p.sku,
        'category', p.category,
        'netPrice', p.net_price,
        'priceWithTax', p.price_with_tax,
        'price', p.price,
        'stock', p.stock,
        'shortDescription', p.short_description,
        'description', p.description,
        'createdAt', p.created_at,
        'updatedAt', p.updated_at,
        'images',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', pi.id::integer,
                  'storagePath', pi.storage_path,
                  'externalUrl', pi.external_url,
                  'position', pi.position
                )
                ORDER BY pi.position
              )
              FROM public.product_images pi
              WHERE pi.product_id = p.id
            ),
            '[]'::jsonb
          )
      ) AS row_data
    FROM public.products p
    WHERE (
        v_search IS NULL
        OR p.name ILIKE '%' || v_search || '%'
        OR p.brand ILIKE '%' || v_search || '%'
        OR p.sku ILIKE '%' || v_search || '%'
      )
      AND (
        v_category IS NULL
        OR p.category = v_category
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_limit
    OFFSET v_offset
  ) q;

  RETURN jsonb_build_object(
    'data', v_data,
    'pagination',
      jsonb_build_object(
        'page', v_page,
        'limit', v_limit,
        'total', v_total,
        'totalPages', v_total_pages,
        'hasPreviousPage', v_page > 1,
        'hasNextPage', v_page < v_total_pages
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_get_product(p_id bigint)
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
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'id', p.id::integer,
    'name', p.name,
    'brand', p.brand,
    'sku', p.sku,
    'category', p.category,
    'netPrice', p.net_price,
    'priceWithTax', p.price_with_tax,
    'price', p.price,
    'stock', p.stock,
    'shortDescription', p.short_description,
    'description', p.description,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at,
    'images',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', pi.id::integer,
              'storagePath', pi.storage_path,
              'externalUrl', pi.external_url,
              'position', pi.position
            )
            ORDER BY pi.position
          )
          FROM public.product_images pi
          WHERE pi.product_id = p.id
        ),
        '[]'::jsonb
      )
  )
  INTO v_result
  FROM public.products p
  WHERE p.id = p_id;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_create_product(
  p_name text,
  p_brand text,
  p_sku text,
  p_category text,
  p_net_price integer,
  p_price integer,
  p_short_description text,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id bigint;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.products (
    name, brand, sku, category,
    net_price, price, short_description, description
  )
  VALUES (
    BTRIM(p_name), BTRIM(p_brand), BTRIM(p_sku), BTRIM(p_category),
    p_net_price, p_price, BTRIM(p_short_description), BTRIM(p_description)
  )
  RETURNING id INTO v_id;

  RETURN public.cys_get_product(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_update_product(
  p_id bigint,
  p_name text,
  p_brand text,
  p_sku text,
  p_category text,
  p_net_price integer,
  p_price integer,
  p_stock integer,
  p_short_description text,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.products
  SET
    name = BTRIM(p_name),
    brand = BTRIM(p_brand),
    sku = BTRIM(p_sku),
    category = BTRIM(p_category),
    net_price = p_net_price,
    price = p_price,
    stock = p_stock,
    short_description = BTRIM(p_short_description),
    description = BTRIM(p_description),
    updated_at = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN public.cys_get_product(p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_replace_product_images(
  p_product_id bigint,
  p_images jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_image jsonb;
  v_storage_path text;
  v_external_url text;
  v_position integer;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  IF p_images IS NULL THEN
    p_images := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(p_images) <> 'array' THEN
    RAISE EXCEPTION 'Las imágenes no son válidas.';
  END IF;

  IF jsonb_array_length(p_images) > 3 THEN
    RAISE EXCEPTION 'Un producto puede tener como máximo 3 imágenes.';
  END IF;

  PERFORM 1
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El producto no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT (value ->> 'position')::integer AS position
      FROM jsonb_array_elements(p_images)
    ) positions
    GROUP BY position
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Las posiciones de las imágenes no pueden repetirse.';
  END IF;

  DELETE FROM public.product_images
  WHERE product_id = p_product_id;

  FOR v_image IN
    SELECT value
    FROM jsonb_array_elements(p_images)
  LOOP
    v_storage_path :=
      NULLIF(BTRIM(COALESCE(v_image ->> 'storagePath', '')), '');
    v_external_url :=
      NULLIF(BTRIM(COALESCE(v_image ->> 'externalUrl', '')), '');
    v_position := (v_image ->> 'position')::integer;

    IF v_position NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'La posición de imagen no es válida.';
    END IF;

    IF
      (v_storage_path IS NULL AND v_external_url IS NULL)
      OR
      (v_storage_path IS NOT NULL AND v_external_url IS NOT NULL)
    THEN
      RAISE EXCEPTION
        'Cada imagen debe tener storagePath o externalUrl, pero no ambos.';
    END IF;

    INSERT INTO public.product_images (
      product_id, storage_path, external_url, position
    )
    VALUES (
      p_product_id, v_storage_path, v_external_url, v_position
    );
  END LOOP;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_delete_product(p_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.products
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_list_categories()
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
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id::integer,
        'name', c.name,
        'createdAt', c.created_at,
        'productCount', (
          SELECT COUNT(*)::integer
          FROM public.products p
          WHERE p.category = c.name
        )
      )
      ORDER BY LOWER(c.name)
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.categories c;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_create_category(p_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_category public.categories%ROWTYPE;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.categories (name)
  VALUES (BTRIM(p_name))
  RETURNING *
  INTO v_category;

  RETURN jsonb_build_object(
    'id', v_category.id::integer,
    'name', v_category.name,
    'createdAt', v_category.created_at,
    'productCount', 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_delete_category(p_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_category public.categories%ROWTYPE;
  v_product_count integer;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_category
  FROM public.categories
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not-found');
  END IF;

  SELECT COUNT(*)::integer
  INTO v_product_count
  FROM public.products
  WHERE category = v_category.name;

  IF v_product_count > 0 THEN
    RETURN jsonb_build_object(
      'status', 'in-use',
      'productCount', v_product_count
    );
  END IF;

  DELETE FROM public.categories
  WHERE id = p_id;

  RETURN jsonb_build_object(
    'status', 'deleted',
    'category',
      jsonb_build_object(
        'id', v_category.id::integer,
        'name', v_category.name
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_create_sale(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_sale_id bigint;
  v_sold_at timestamptz;
  v_total bigint := 0;
  v_prepared jsonb := '[]'::jsonb;
  v_item record;
  v_product record;
  v_subtotal bigint;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  IF
    p_items IS NULL
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) < 1
  THEN
    RAISE EXCEPTION 'La venta debe incluir al menos un producto.';
  END IF;

  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'La venta contiene demasiados productos.';
  END IF;

  FOR v_item IN
    SELECT
      (value ->> 'productId')::bigint AS product_id,
      SUM((value ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items)
    GROUP BY (value ->> 'productId')::bigint
    ORDER BY (value ->> 'productId')::bigint
  LOOP
    IF v_item.product_id < 1 OR v_item.quantity < 1 THEN
      RAISE EXCEPTION 'La venta contiene un producto o cantidad no válida.';
    END IF;

    SELECT p.id, p.name, p.price, p.stock
    INTO v_product
    FROM public.products p
    WHERE p.id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Uno de los productos ya no existe.'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION
        'Stock insuficiente para "%". Disponible: %.',
        v_product.name,
        v_product.stock
        USING ERRCODE = 'P0001';
    END IF;

    v_subtotal :=
      v_product.price::bigint *
      v_item.quantity::bigint;

    v_total := v_total + v_subtotal;

    v_prepared :=
      v_prepared ||
      jsonb_build_array(
        jsonb_build_object(
          'productId', v_product.id::integer,
          'productName', v_product.name,
          'unitPrice', v_product.price,
          'quantity', v_item.quantity,
          'subtotal', v_subtotal
        )
      );
  END LOOP;

  INSERT INTO public.sales (
    seller_id,
    seller_email,
    total_amount
  )
  VALUES (
    v_user_id,
    v_email,
    v_total
  )
  RETURNING id, sold_at
  INTO v_sale_id, v_sold_at;

  FOR v_item IN
    SELECT
      (value ->> 'productId')::bigint AS product_id,
      value ->> 'productName' AS product_name,
      (value ->> 'unitPrice')::bigint AS unit_price,
      (value ->> 'quantity')::integer AS quantity,
      (value ->> 'subtotal')::bigint AS subtotal
    FROM jsonb_array_elements(v_prepared)
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
      stock = stock - v_item.quantity,
      updated_at = NOW()
    WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_sale_id::integer,
    'sellerId', v_user_id,
    'sellerEmail', v_email,
    'soldAt', v_sold_at,
    'total', v_total,
    'items', v_prepared
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_list_sales()
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
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id::integer,
        'seller',
          COALESCE(s.seller_email, 'Usuario eliminado'),
        'soldAt', s.sold_at,
        'total', s.total_amount,
        'items',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'productId', si.product_id::integer,
                  'name', si.product_name,
                  'quantity', si.quantity,
                  'unitPrice', si.unit_price
                )
                ORDER BY si.id
              )
              FROM public.sale_items si
              WHERE si.sale_id = s.id
            ),
            '[]'::jsonb
          )
      )
      ORDER BY s.sold_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.sales s;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cys_activate_owner_internal(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_owner_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('cys-owner-registration'));

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'profile-not-found');
  END IF;

  IF v_profile.account_type = 'developer' THEN
    RETURN jsonb_build_object(
      'status', 'already-authorized',
      'accountType', 'developer'
    );
  END IF;

  IF v_profile.account_type = 'owner' THEN
    RETURN jsonb_build_object(
      'status', 'already-authorized',
      'accountType', 'owner'
    );
  END IF;

  IF v_profile.account_type <> 'pending' THEN
    RETURN jsonb_build_object('status', 'invalid-state');
  END IF;

  SELECT COUNT(*)::integer
  INTO v_owner_count
  FROM public.profiles
  WHERE account_type = 'owner';

  IF v_owner_count >= 3 THEN
    RETURN jsonb_build_object(
      'status', 'registration-full',
      'ownersUsed', v_owner_count,
      'ownersLimit', 3
    );
  END IF;

  UPDATE public.profiles
  SET
    role = 'admin',
    account_type = 'owner',
    active = true,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING *
  INTO v_profile;

  RETURN jsonb_build_object(
    'status', 'activated',
    'profile',
      jsonb_build_object(
        'id', v_profile.id,
        'fullName', v_profile.full_name,
        'role', v_profile.role,
        'accountType', v_profile.account_type,
        'active', v_profile.active
      ),
    'ownersUsed', v_owner_count + 1,
    'ownersLimit', 3
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cys_list_products(integer, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_get_product(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_create_product(text, text, text, text, integer, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_update_product(bigint, text, text, text, text, integer, integer, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_replace_product_images(bigint, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_delete_product(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_list_categories() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_create_category(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_delete_category(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_create_sale(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_list_sales() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cys_activate_owner_internal(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cys_list_products(integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_get_product(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_create_product(text, text, text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_update_product(bigint, text, text, text, text, integer, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_replace_product_images(bigint, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_delete_product(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_list_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_create_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_delete_category(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_create_sale(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_list_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cys_activate_owner_internal(uuid) TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        COALESCE(qual, '') ILIKE '%product-images%'
        OR COALESCE(with_check, '') ILIKE '%product-images%'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON storage.objects',
      policy_row.policyname
    );
  END LOOP;
END
$$;

CREATE POLICY "cys_product_images_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.cys_is_authorized_user()
);

CREATE POLICY "cys_product_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.cys_is_authorized_user()
);

CREATE POLICY "cys_product_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.cys_is_authorized_user()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.cys_is_authorized_user()
);

CREATE POLICY "cys_product_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.cys_is_authorized_user()
);

COMMIT;
