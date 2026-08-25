import { pool } from '../db/pool.js'

export async function getCategories() {
  const result = await pool.query(`
    SELECT
      id::int AS id,
      name,
      created_at AS "createdAt"
    FROM categories
    ORDER BY lower(name)
  `)

  return result.rows
}

export async function createCategory(
  name: string,
) {
  const result = await pool.query(
    `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING
        id::int AS id,
        name,
        created_at AS "createdAt"
    `,
    [name.trim()],
  )

  return result.rows[0]
}
