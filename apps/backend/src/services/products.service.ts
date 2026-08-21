import type {
  CreateProductInput,
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