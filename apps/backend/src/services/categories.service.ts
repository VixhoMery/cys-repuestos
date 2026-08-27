import { pool } from '../db/pool.js'


export async function getCategories() {
  const result = await pool.query(`
    SELECT
      c.id::int AS id,
      c.name,
      c.created_at AS "createdAt",
      COUNT(p.id)::int AS "productCount"
    FROM categories c
    LEFT JOIN products p
      ON p.category = c.name
    GROUP BY
      c.id,
      c.name,
      c.created_at
    ORDER BY lower(c.name)
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

  return {
    ...result.rows[0],
    productCount: 0,
  }
}


export async function deleteCategory(
  id: number,
) {
  const client =
    await pool.connect()

  try {
    await client.query('BEGIN')

    const categoryResult =
      await client.query(
        `
          SELECT
            id::int AS id,
            name
          FROM categories
          WHERE id = $1
          FOR UPDATE
        `,
        [id],
      )

    const category =
      categoryResult.rows[0]

    if (!category) {
      await client.query(
        'ROLLBACK',
      )

      return {
        status:
          'not-found' as const,
      }
    }

    const countResult =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM products
          WHERE category = $1
        `,
        [category.name],
      )

    const productCount =
      Number(
        countResult.rows[0]
          ?.count ?? 0,
      )

    if (productCount > 0) {
      await client.query(
        'ROLLBACK',
      )

      return {
        status:
          'in-use' as const,
        productCount,
      }
    }

    await client.query(
      `
        DELETE FROM categories
        WHERE id = $1
      `,
      [id],
    )

    await client.query('COMMIT')

    return {
      status:
        'deleted' as const,
      category,
    }
  } catch (error: any) {
    await client.query(
      'ROLLBACK',
    )

    // Protección adicional:
    // si entre la comprobación y
    // el DELETE aparece una FK.
    if (error?.code === '23503') {
      return {
        status:
          'in-use' as const,
        productCount: 1,
      }
    }

    throw error
  } finally {
    client.release()
  }
}
