import { z } from 'zod'

export const paymentMethodSchema = z.enum([
  'efectivo',
  'debito',
  'credito',
  'transferencia',
  'otro',
])

export type PaymentMethod =
  z.infer<typeof paymentMethodSchema>

const installmentsSchema = z.preprocess(
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

function positiveIntegerSchema(
  requiredMessage: string,
  integerMessage: string,
  positiveMessage: string,
  maxValue: number,
  maxMessage: string,
) {
  return z
    .union([
      z.number(),

      z
        .string()
        .trim()
        .min(
          1,
          requiredMessage,
        )
        .regex(
          /^\\d+$/,
          integerMessage,
        ),
    ])
    .transform(
      (value) =>
        typeof value ===
          'number'
          ? value
          : Number(value),
    )
    .pipe(
      z
        .number()
        .int(
          integerMessage,
        )
        .positive(
          positiveMessage,
        )
        .max(
          maxValue,
          maxMessage,
        ),
    )
}

const quantitySchema = positiveIntegerSchema(
  'La cantidad es obligatoria',
  'La cantidad debe ser un número entero',
  'La cantidad debe ser mayor a 0',
  2_147_483_647,
  'La cantidad es demasiado grande',
)

const temporaryNetPriceSchema = positiveIntegerSchema(
  'El valor neto es obligatorio',
  'El valor neto debe ser un número entero',
  'El valor neto debe ser mayor a $0',
  1_804_608_106,
  'El valor neto es demasiado grande',
)

const temporarySalePriceSchema = positiveIntegerSchema(
  'El valor de venta es obligatorio',
  'El valor de venta debe ser un número entero',
  'El valor de venta debe ser mayor a $0',
  2_147_483_647,
  'El valor de venta es demasiado grande',
)

export const inventorySaleItemSchema =
  z.object({
    type: z.literal('inventory').optional(),

    productId: z.coerce
      .number()
      .int(
        'El producto seleccionado no es válido',
      )
      .positive(
        'El producto seleccionado no es válido',
      ),

    quantity: quantitySchema,
  })

export const temporarySaleItemSchema =
  z.object({
    type: z.literal('temporary'),

    name: z
      .string()
      .trim()
      .min(
        1,
        'El nombre del producto temporal es obligatorio',
      )
      .max(
        100,
        'El nombre del producto temporal no puede superar los 100 caracteres',
      ),

    netPrice: temporaryNetPriceSchema,

    salePrice: temporarySalePriceSchema,

    quantity: quantitySchema,
  })

export const saleItemSchema =
  z.union([
    inventorySaleItemSchema,
    temporarySaleItemSchema,
  ])

export type InventorySaleItemInput =
  z.infer<
    typeof inventorySaleItemSchema
  >

export type TemporarySaleItemInput =
  z.infer<
    typeof temporarySaleItemSchema
  >

export type SaleItemInput =
  z.infer<typeof saleItemSchema>

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

export type CreateSaleInput =
  z.infer<
    typeof createSaleSchema
  >
