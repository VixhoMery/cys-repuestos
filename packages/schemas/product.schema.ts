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

  shortDescription: z
    .string()
    .trim()
    .min(1, 'La descripción corta es obligatoria')
    .max(
      120,
      'La descripción corta no puede superar los 120 caracteres',
    ),

  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(
      1500,
      'La descripción no puede superar los 1500 caracteres',
    ),
})


// Crear producto
export const createProductSchema = productBaseSchema


// Editar producto
export const editProductSchema = productBaseSchema.extend({
  stock: z.coerce
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
})


// Tipos de TypeScript generados automáticamente desde Zod
export type CreateProductInput =
  z.infer<typeof createProductSchema>

export type EditProductInput =
  z.infer<typeof editProductSchema>