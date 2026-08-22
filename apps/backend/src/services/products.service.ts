import type {
  CreateProductInput,
  EditProductInput,
  ProductImageInput,
} from '@cys-repuestos/schemas'

import { pool } from '../db/pool.js'


// ------------------------------------
// Obtener productos
// ------------------------------------

export async function getProducts() {
  const result = await pool.query(`
    SELECT
      p.id::int AS id,
      p.name,
      p.brand,
      p.sku,
      p.category,
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
    ORDER BY p.created_at DESC
  `)

  return result.rows
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
        $7
      )
      RETURNING
        id::int AS id,
        name,
        brand,
        sku,
        category,
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
        price = $5,
        stock = $6,
        short_description = $7,
        description = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING id::int AS id
    `,
    [
      product.name,
      product.brand,
      product.sku,
      product.category,
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

    // Bloquea este producto durante el reemplazo de imágenes.
    // Evita que dos solicitudes simultáneas intenten insertar
    // la misma posición (product_id, position).
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
    await client.query('ROLLBACK')
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
