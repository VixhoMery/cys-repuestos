import { pool } from '../db/pool.js'

export async function getProducts() {
  const result = await pool.query(`
    SELECT
      id,
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