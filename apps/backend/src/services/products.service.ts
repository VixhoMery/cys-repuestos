import type {
  CreateProductInput,
  EditProductInput,
} from '@cys-repuestos/schemas'

import { pool } from '../db/pool.js'


// ------------------------------------
// Obtener productos
// ------------------------------------

export async function getProducts() {
  const result = await pool.query(`
    SELECT
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
    FROM products
    ORDER BY created_at DESC
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

  return result.rows[0]
}

export async function getProductById(
  id: number,
) {
  const result = await pool.query(
    `
      SELECT
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
      FROM products
      WHERE id = $1
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
      product.stock,
      product.shortDescription,
      product.description,
      id,
    ],
  )

  return result.rows[0] ?? null
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