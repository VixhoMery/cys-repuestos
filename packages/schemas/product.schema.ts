import { z } from 'zod'

export const productBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del producto es obligatorio')
    .max(100, 'El nombre no puede superar los 100 caracteres'),

  brand: z
    .string()
    .trim()
    .min(1, 'La marca es obligatoria')
    .max(60, 'La marca no puede superar los 60 caracteres'),

  sku: z
    .string()
    .trim()
    .min(1, 'El SKU es obligatorio')
    .max(50, 'El SKU no puede superar los 50 caracteres'),

  category: z
    .string()
    .trim()
    .min(1, 'La categoría es obligatoria'),

  price: z.coerce
    .number()
    .positive('El precio debe ser mayor a $0'),

  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(300, 'La descripción no puede superar los 300 caracteres'),
})

export const createProductSchema = productBaseSchema
export const editProductSchema = productBaseSchema.extend({
  stock: z.coerce
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
})


export type CreateProductInput =
  z.infer<typeof createProductSchema>

export type EditProductInput =
  z.infer<typeof editProductSchema>