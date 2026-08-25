import type {
  CreateProductInput,
  EditProductInput,
  ProductImageInput,
} from '@cys-repuestos/schemas'

import { pool } from '../db/pool.js'


export type ProductListParams = {
  page: number
  limit: number
  search?: string
  category?: string
}


// ------------------------------------
// Obtener productos paginados
// ------------------------------------

export async function getProducts({
  page,
  limit,
  search,
  category,
}: ProductListParams) {
  const conditions: string[] = []
  const values: Array<
    string | number
  > = []

  const normalizedSearch =
    search?.trim()

  const normalizedCategory =
    category?.trim()

  if (normalizedSearch) {
    values.push(
      `%${normalizedSearch}%`,
    )

    const parameter =
      `$${values.length}`

    conditions.push(
      `(
        p.name ILIKE ${parameter}
        OR p.brand ILIKE ${parameter}
        OR p.sku ILIKE ${parameter}
      )`,
    )
  }

  if (normalizedCategory) {
    values.push(normalizedCategory)

    conditions.push(
      `p.category = $${values.length}`,
    )
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(
          ' AND ',
        )}`
      : ''

  // Total filtrado para calcular páginas.
  const countResult =
    await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM products p
        ${whereClause}
      `,
      values,
    )

  const total =
    Number(
      countResult.rows[0]?.total ?? 0,
    )

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / limit),
    )

  const offset =
    (page - 1) * limit

  const dataValues = [
    ...values,
    limit,
    offset,
  ]

  const limitParameter =
    `$${values.length + 1}`

  const offsetParameter =
    `$${values.length + 2}`

  const result =
    await pool.query(
      `
        SELECT
          p.id::int AS id,
          p.name,
          p.brand,
          p.sku,
          p.category,
          p.net_price AS "netPrice",
          p.price_with_tax AS "priceWithTax",
          p.price,
          p.stock,
          p.short_description AS "shortDescription",
          p.description,
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pi.id::int,
                  'storagePath', pi.storage_path,
                  'externalUrl', pi.external_url,
                  'position', pi.position
                )
                ORDER BY pi.position
              )
              FROM product_images pi
              WHERE pi.product_id = p.id
            ),
            '[]'::json
          ) AS images
        FROM products p
        ${whereClause}
        ORDER BY
          p.created_at DESC,
          p.id DESC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
      `,
      dataValues,
    )

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage:
        page > 1,
      hasNextPage:
        page < totalPages,
    },
  }
}


// ------------------------------------
// Crear producto
// ------------------------------------

export async function createProduct(
  product: CreateProductInput,
) {
  const result = await pool.query(
    `
      INSERT INTO products (
        name,
        brand,
        sku,
        category,
        net_price,
        price,
        short_description,
        description
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING
        id::int AS id,
        name,
        brand,
        sku,
        category,
        net_price AS "netPrice",
        price_with_tax AS "priceWithTax",
        price,
        stock,
        short_description AS "shortDescription",
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      product.name,
      product.brand,
      product.sku,
      product.category,
      product.netPrice,
      product.price,
      product.shortDescription,
      product.description,
    ],
  )

  return {
    ...result.rows[0],
    images: [],
  }
}


// ------------------------------------
// Obtener producto por ID
// ------------------------------------

export async function getProductById(
  id: number,
) {
  const result = await pool.query(
    `
      SELECT
        p.id::int AS id,
        p.name,
        p.brand,
        p.sku,
        p.category,
        p.net_price AS "netPrice",
        p.price_with_tax AS "priceWithTax",
        p.price,
        p.stock,
        p.short_description AS "shortDescription",
        p.description,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id::int,
                'storagePath', pi.storage_path,
                'externalUrl', pi.external_url,
                'position', pi.position
              )
              ORDER BY pi.position
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images
      FROM products p
      WHERE p.id = $1
    `,
    [id],
  )

  return result.rows[0] ?? null
}


// ------------------------------------
// Editar producto
// ------------------------------------

export async function updateProduct(
  id: number,
  product: EditProductInput,
) {
  const result = await pool.query(
    `
      UPDATE products
      SET
        name = $1,
        brand = $2,
        sku = $3,
        category = $4,
        net_price = $5,
        price = $6,
        stock = $7,
        short_description = $8,
        description = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING id::int AS id
    `,
    [
      product.name,
      product.brand,
      product.sku,
      product.category,
      product.netPrice,
      product.price,
      product.stock,
      product.shortDescription,
      product.description,
      id,
    ],
  )

  if (!result.rows[0]) {
    return null
  }

  return getProductById(id)
}


// ------------------------------------
// Reemplazar imágenes de un producto
// ------------------------------------

export async function replaceProductImages(
  productId: number,
  images: ProductImageInput[],
) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `
        SELECT id
        FROM products
        WHERE id = $1
        FOR UPDATE
      `,
      [productId],
    )

    await client.query(
      `
        DELETE FROM product_images
        WHERE product_id = $1
      `,
      [productId],
    )

    for (const image of images) {
      await client.query(
        `
          INSERT INTO product_images (
            product_id,
            storage_path,
            external_url,
            position
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          productId,
          image.storagePath,
          image.externalUrl,
          image.position,
        ],
      )
    }

    await client.query('COMMIT')

    const result = await pool.query(
      `
        SELECT
          id::int AS id,
          storage_path AS "storagePath",
          external_url AS "externalUrl",
          position
        FROM product_images
        WHERE product_id = $1
        ORDER BY position
      `,
      [productId],
    )

    return result.rows
  } catch (error) {
    await client.query(
      'ROLLBACK',
    )

    throw error
  } finally {
    client.release()
  }
}


// ------------------------------------
// Eliminar producto
// ------------------------------------

export async function deleteProduct(
  id: number,
) {
  const result = await pool.query(
    `
      DELETE FROM products
      WHERE id = $1
      RETURNING id::int AS id
    `,
    [id],
  )

  return result.rows[0] ?? null
}
