import type {
  CreateSaleInput,
} from '@cys-repuestos/schemas'

import { pool } from '../db/pool.js'


type Seller = {
  id: string
  email: string | null
}


type PreparedSaleItem = {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}


export class SaleError extends Error {
  status: number

  constructor(
    message: string,
    status = 400,
  ) {
    super(message)
    this.name = 'SaleError'
    this.status = status
  }
}


// ------------------------------------
// Registrar venta
// ------------------------------------

export async function createSale(
  seller: Seller,
  input: CreateSaleInput,
) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const preparedItems:
      PreparedSaleItem[] = []

    let totalAmount = 0


    // --------------------------------
    // Bloquear productos y comprobar
    // stock/precio reales
    // --------------------------------

    for (const item of input.items) {
      const result =
        await client.query(
          `
            SELECT
              id::int AS id,
              name,
              price,
              stock
            FROM products
            WHERE id = $1
            FOR UPDATE
          `,
          [item.productId],
        )

      const product =
        result.rows[0]

      if (!product) {
        throw new SaleError(
          'Uno de los productos ya no existe.',
          404,
        )
      }

      const stock =
        Number(product.stock)

      if (stock < item.quantity) {
        throw new SaleError(
          `Stock insuficiente para "${product.name}". Disponible: ${stock}.`,
          409,
        )
      }

      const unitPrice =
        Number(product.price)

      const subtotal =
        unitPrice * item.quantity

      totalAmount += subtotal

      preparedItems.push({
        productId:
          Number(product.id),
        productName:
          product.name,
        unitPrice,
        quantity:
          item.quantity,
        subtotal,
      })
    }


    // --------------------------------
    // Crear cabecera de venta
    // --------------------------------

    const saleResult =
      await client.query(
        `
          INSERT INTO sales (
            seller_id,
            seller_email,
            total_amount
          )
          VALUES ($1, $2, $3)
          RETURNING
            id::int AS id,
            seller_id AS "sellerId",
            seller_email AS "sellerEmail",
            sold_at AS "soldAt",
            total_amount AS total
        `,
        [
          seller.id,
          seller.email,
          totalAmount,
        ],
      )

    const sale =
      saleResult.rows[0]


    // --------------------------------
    // Detalle + descuento de stock
    // --------------------------------

    for (
      const item of preparedItems
    ) {
      await client.query(
        `
          INSERT INTO sale_items (
            sale_id,
            product_id,
            product_name,
            unit_price,
            quantity,
            subtotal
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
        `,
        [
          sale.id,
          item.productId,
          item.productName,
          item.unitPrice,
          item.quantity,
          item.subtotal,
        ],
      )

      await client.query(
        `
          UPDATE products
          SET
            stock =
              stock - $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [
          item.quantity,
          item.productId,
        ],
      )
    }


    await client.query('COMMIT')

    return {
      ...sale,
      items: preparedItems,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
