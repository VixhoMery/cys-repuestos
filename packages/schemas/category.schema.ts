import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      1,
      'El nombre de la categoría es obligatorio',
    )
    .max(
      60,
      'La categoría no puede superar los 60 caracteres',
    ),
})

export type CreateCategoryInput =
  z.infer<typeof createCategorySchema>
