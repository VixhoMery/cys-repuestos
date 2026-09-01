BEGIN;


-- ============================================================
-- MATRIZ CENTRAL DE PERMISOS
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_has_permission(
    p_permission text
  )
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_active boolean;
  v_account_type text;
  v_role text;
BEGIN
  SELECT
    p.active,
    p.account_type,
    p.role
  INTO
    v_active,
    v_account_type,
    v_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_active IS NOT true THEN
    RETURN false;
  END IF;

  -- Owner y developer conservan acceso completo.
  IF v_account_type IN (
    'owner',
    'developer'
  ) THEN
    RETURN true;
  END IF;

  -- Los demás permisos solo aplican a staff.
  IF v_account_type <> 'staff' THEN
    RETURN false;
  END IF;


  -- ----------------------------------------------------------
  -- ADMINISTRADOR
  -- ----------------------------------------------------------

  IF v_role = 'admin' THEN
    RETURN p_permission IN (
      'products.read',
      'products.create',
      'products.update',
      'products.delete',
      'inventory.update',
      'categories.manage',
      'suppliers.manage',
      'sales.create',
      'sales.read',
      'statistics.read'
    );
  END IF;


  -- ----------------------------------------------------------
  -- VENDEDOR
  -- ----------------------------------------------------------

  IF v_role = 'vendedor' THEN
    RETURN p_permission IN (
      'products.read',
      'sales.create'
    );
  END IF;


  -- ----------------------------------------------------------
  -- BODEGA
  -- ----------------------------------------------------------

  IF v_role = 'bodega' THEN
    RETURN p_permission IN (
      'products.read',
      'inventory.update'
    );
  END IF;


  RETURN false;
END;
$$;


REVOKE ALL ON FUNCTION
  public.cys_has_permission(text)
FROM
  PUBLIC,
  anon;

GRANT EXECUTE ON FUNCTION
  public.cys_has_permission(text)
TO
  authenticated,
  service_role;


-- ============================================================
-- CAMBIAR LOS GUARDS DE LOS RPC EXISTENTES
--
-- Conservamos EXACTAMENTE los cuerpos actuales de los RPC.
-- Solo reemplazamos:
--
--   cys_is_authorized_user()
--
-- por:
--
--   cys_has_permission('permiso')
--
-- Esto evita duplicar y desincronizar la lógica actual.
-- ============================================================

DO $$
DECLARE
  v_item record;
  v_oid oid;
  v_definition text;
  v_old_guard text :=
    'public.cys_is_authorized_user()';
  v_new_guard text;
BEGIN
  FOR v_item IN
    SELECT *
    FROM (
      VALUES

        -- Productos: lectura
        (
          'public.cys_list_products(integer,integer,text,text)',
          'products.read'
        ),
        (
          'public.cys_get_product(bigint)',
          'products.read'
        ),

        -- Productos: escritura
        (
          'public.cys_create_product(text,text,text,text,bigint,text,integer,integer,integer,text,text)',
          'products.create'
        ),
        (
          'public.cys_update_product(bigint,text,text,text,text,bigint,text,integer,integer,integer,text,text)',
          'products.update'
        ),
        (
          'public.cys_replace_product_images(bigint,jsonb)',
          'products.update'
        ),
        (
          'public.cys_delete_product(bigint)',
          'products.delete'
        ),

        -- Categorías
        (
          'public.cys_list_categories()',
          'products.read'
        ),
        (
          'public.cys_create_category(text)',
          'categories.manage'
        ),
        (
          'public.cys_delete_category(bigint)',
          'categories.manage'
        ),

        -- Proveedores
        (
          'public.cys_list_suppliers()',
          'products.read'
        ),
        (
          'public.cys_create_supplier(text)',
          'suppliers.manage'
        ),
        (
          'public.cys_delete_supplier(bigint)',
          'suppliers.manage'
        ),

        -- Ventas
        (
          'public.cys_create_sale(jsonb,text,integer)',
          'sales.create'
        ),
        (
          'public.cys_list_sales()',
          'sales.read'
        ),

        -- Estadísticas
        (
          'public.cys_list_sales_range(timestamptz,timestamptz)',
          'statistics.read'
        )

    ) AS permission_map(
      function_signature,
      permission_name
    )
  LOOP

    v_oid :=
      to_regprocedure(
        v_item.function_signature
      );

    IF v_oid IS NULL THEN
      RAISE EXCEPTION
        'No existe la función %.',
        v_item.function_signature;
    END IF;

    v_definition :=
      pg_get_functiondef(
        v_oid
      );

    v_new_guard :=
      format(
        'public.cys_has_permission(%L)',
        v_item.permission_name
      );

    -- Si todavía tiene el guard antiguo,
    -- lo reemplazamos.
    IF
      strpos(
        v_definition,
        v_old_guard
      ) > 0
    THEN

      v_definition :=
        replace(
          v_definition,
          v_old_guard,
          v_new_guard
        );

      EXECUTE
        v_definition;

    -- Si ya contiene el guard correcto,
    -- no hacemos nada.
    ELSIF
      strpos(
        v_definition,
        v_new_guard
      ) > 0
    THEN

      NULL;

    ELSE

      RAISE EXCEPTION
        'La función % no contiene un guard de autorización reconocible.',
        v_item.function_signature;

    END IF;

  END LOOP;
END;
$$;


-- ============================================================
-- RPC ESPECÍFICO PARA BODEGA
--
-- Bodega NO usa cys_update_product porque esa función permite
-- modificar precios, nombre, proveedor, etc.
--
-- Este RPC solamente permite:
--   - stock
--   - ubicación
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_update_inventory(
    p_id bigint,
    p_stock integer,
    p_location text
  )
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_location text :=
    NULLIF(
      BTRIM(
        COALESCE(
          p_location,
          ''
        )
      ),
      ''
    );
BEGIN
  IF NOT public.cys_has_permission(
    'inventory.update'
  ) THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF
    p_id IS NULL
    OR p_id < 1
  THEN
    RAISE EXCEPTION
      'El producto no es válido.';
  END IF;

  IF
    p_stock IS NULL
    OR p_stock < 0
  THEN
    RAISE EXCEPTION
      'El stock no puede ser negativo.';
  END IF;

  IF
    CHAR_LENGTH(
      COALESCE(
        v_location,
        ''
      )
    ) > 120
  THEN
    RAISE EXCEPTION
      'La ubicación no puede superar los 120 caracteres.';
  END IF;

  UPDATE public.products
  SET
    stock =
      p_stock,
    location =
      v_location,
    updated_at =
      NOW()
  WHERE id =
    p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'El producto no existe.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN
    public.cys_get_product(
      p_id
    );
END;
$$;


REVOKE ALL ON FUNCTION
  public.cys_update_inventory(
    bigint,
    integer,
    text
  )
FROM
  PUBLIC,
  anon;

GRANT EXECUTE ON FUNCTION
  public.cys_update_inventory(
    bigint,
    integer,
    text
  )
TO
  authenticated;


-- ============================================================
-- STORAGE: IMÁGENES DE PRODUCTOS
--
-- Lectura:
--   todos quienes puedan leer productos.
--
-- Escritura:
--   owner/developer/admin.
--
-- vendedor y bodega NO pueden modificar imágenes.
-- ============================================================

DROP POLICY IF EXISTS
  "cys_product_images_select"
ON storage.objects;

DROP POLICY IF EXISTS
  "cys_product_images_insert"
ON storage.objects;

DROP POLICY IF EXISTS
  "cys_product_images_update"
ON storage.objects;

DROP POLICY IF EXISTS
  "cys_product_images_delete"
ON storage.objects;


CREATE POLICY
  "cys_product_images_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id =
    'product-images'
  AND
  public.cys_has_permission(
    'products.read'
  )
);


CREATE POLICY
  "cys_product_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id =
    'product-images'
  AND
  (
    public.cys_has_permission(
      'products.create'
    )
    OR
    public.cys_has_permission(
      'products.update'
    )
  )
);


CREATE POLICY
  "cys_product_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id =
    'product-images'
  AND
  public.cys_has_permission(
    'products.update'
  )
)
WITH CHECK (
  bucket_id =
    'product-images'
  AND
  public.cys_has_permission(
    'products.update'
  )
);


CREATE POLICY
  "cys_product_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id =
    'product-images'
  AND
  (
    public.cys_has_permission(
      'products.update'
    )
    OR
    public.cys_has_permission(
      'products.delete'
    )
  )
);


COMMIT;