import { z } from 'zod'

export const saleItemSchema = z.object({
  productId: z.coerce
    .number()
    .int()
    .positive(),

  quantity: z.coerce
    .number()
    .int()
    .min(1),
})

export const createSaleSchema = z.object({
  items: z
    .array(saleItemSchema)
    .min(1, 'La venta debe incluir al menos un producto')
    .max(100, 'La venta contiene demasiados productos'),
})

export type SaleItemInput =
  z.infer<typeof saleItemSchema>

export type CreateSaleInput =
  z.infer<typeof createSaleSchema>
