import { z } from 'zod'

export const paymentMethodSchema =
  z.enum([
    'efectivo',
    'debito',
    'credito',
    'transferencia',
    'otro',
  ])

export type PaymentMethod =
  z.infer<typeof paymentMethodSchema>

const installmentsSchema =
  z.preprocess(
    (value) => {
      if (
        value === '' ||
        value === null ||
        value === undefined
      ) {
        return null
      }

      return value
    },
    z.coerce
      .number()
      .int(
        'Las cuotas deben ser un número entero',
      )
      .min(
        1,
        'Las cuotas deben ser al menos 1',
      )
      .max(
        36,
        'Las cuotas no pueden superar 36',
      )
      .nullable(),
  )

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

export const createSaleSchema = z
  .object({
    items: z
      .array(saleItemSchema)
      .min(
        1,
        'La venta debe incluir al menos un producto',
      )
      .max(
        100,
        'La venta contiene demasiados productos',
      ),

    paymentMethod:
      paymentMethodSchema,

    installments:
      installmentsSchema,
  })
  .superRefine(
    (
      value,
      context,
    ) => {
      if (
        value.paymentMethod ===
          'credito' &&
        value.installments ===
          null
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            'installments',
          ],
          message:
            'Selecciona la cantidad de cuotas',
        })
      }

      if (
        value.paymentMethod !==
          'credito' &&
        value.installments !==
          null
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            'installments',
          ],
          message:
            'Las cuotas solo corresponden a pagos con crédito',
        })
      }
    },
  )

export type SaleItemInput =
  z.infer<typeof saleItemSchema>

export type CreateSaleInput =
  z.infer<typeof createSaleSchema>
