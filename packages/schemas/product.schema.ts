import { z } from 'zod'


function moneySchema(
  requiredMessage: string,
  numbersMessage: string,
  positiveMessage: string,
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
          /^\d+$/,
          numbersMessage,
        ),
    ])
    .transform((value) =>
      typeof value === 'number'
        ? value
        : Number(value),
    )
    .pipe(
      z
        .number()
        .int(numbersMessage)
        .positive(positiveMessage),
    )
}


const netPriceSchema = moneySchema(
  'El valor neto es obligatorio',
  'El valor neto solo puede contener números',
  'El valor neto debe ser mayor a $0',
)


const salePriceSchema = moneySchema(
  'El valor de venta es obligatorio',
  'El valor de venta solo puede contener números',
  'El valor de venta debe ser mayor a $0',
)


const stockSchema = z.coerce
  .number()
  .int(
    'El stock debe ser un número entero',
  )
  .min(
    0,
    'El stock no puede ser negativo',
  )


const optionalSupplierIdSchema =
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
        'El proveedor seleccionado no es válido',
      )
      .positive(
        'El proveedor seleccionado no es válido',
      )
      .nullable(),
  )


export const productBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      1,
      'El nombre del producto es obligatorio',
    )
    .max(
      100,
      'El nombre no puede superar los 100 caracteres',
    ),

  brand: z
    .string()
    .trim()
    .min(
      1,
      'La marca es obligatoria',
    )
    .max(
      60,
      'La marca no puede superar los 60 caracteres',
    ),

  sku: z
    .string()
    .trim()
    .min(
      1,
      'El SKU es obligatorio',
    )
    .max(
      50,
      'El SKU no puede superar los 50 caracteres',
    ),

  category: z
    .string()
    .trim()
    .min(
      1,
      'La categoría es obligatoria',
    )
    .max(
      60,
      'La categoría no puede superar los 60 caracteres',
    ),

  supplierId:
    optionalSupplierIdSchema,

  location: z
    .string()
    .trim()
    .max(
      120,
      'La ubicación no puede superar los 120 caracteres',
    )
    .optional()
    .default(''),

  netPrice: netPriceSchema,

  // price se mantiene como valor de venta
  // para no romper POS, ventas ni estadísticas.
  price: salePriceSchema,

  stock: stockSchema,

  shortDescription: z
    .string()
    .trim()
    .min(
      1,
      'La descripción corta es obligatoria',
    )
    .max(
      50,
      'La descripción corta no puede superar los 50 caracteres',
    ),

  description: z
    .string()
    .trim()
    .min(
      1,
      'La descripción es obligatoria',
    )
    .max(
      6000,
      'La descripción no puede superar los 6000 caracteres',
    ),
})


export const createProductSchema =
  productBaseSchema


export const editProductSchema =
  productBaseSchema


export type CreateProductInput =
  z.infer<typeof createProductSchema>

export type EditProductInput =
  z.infer<typeof editProductSchema>
