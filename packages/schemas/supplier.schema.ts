import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      1,
      'El nombre del proveedor es obligatorio',
    )
    .max(
      100,
      'El proveedor no puede superar los 100 caracteres',
    ),
})

export type CreateSupplierInput =
  z.infer<typeof createSupplierSchema>
