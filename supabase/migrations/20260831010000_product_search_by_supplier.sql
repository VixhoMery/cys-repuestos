BEGIN;

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
    RAISE EXCEPTION 'No autorizado.'
      USING ERRCODE = '42501';
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
      OR EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = p.supplier_id
          AND s.name ILIKE '%' || v_search || '%'
      )
    )
    AND (
      v_category IS NULL
      OR p.category = v_category
    );

  v_total_pages :=
    GREATEST(
      1,
      CEIL(v_total::numeric / v_limit)::integer
    );

  SELECT COALESCE(
    jsonb_agg(
      row_data
      ORDER BY created_at DESC, id DESC
    ),
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
        'supplierId', p.supplier_id,
        'supplierName', (
          SELECT s.name
          FROM public.suppliers s
          WHERE s.id = p.supplier_id
        ),
        'location', p.location,
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
        OR EXISTS (
          SELECT 1
          FROM public.suppliers s
          WHERE s.id = p.supplier_id
            AND s.name ILIKE '%' || v_search || '%'
        )
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

REVOKE ALL
ON FUNCTION public.cys_list_products(
  integer,
  integer,
  text,
  text
)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.cys_list_products(
  integer,
  integer,
  text,
  text
)
TO authenticated, service_role;

COMMIT;