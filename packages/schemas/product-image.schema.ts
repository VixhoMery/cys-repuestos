import { z } from 'zod'

const productImageInputSchema = z
  .object({
    storagePath: z.string().trim().min(1).nullable(),
    externalUrl: z.string().trim().url().nullable(),
    position: z.number().int().min(1).max(3),
  })
  .superRefine((image, ctx) => {
    const hasStoragePath = image.storagePath !== null
    const hasExternalUrl = image.externalUrl !== null

    if (hasStoragePath === hasExternalUrl) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Cada imagen debe tener storagePath o externalUrl, pero no ambos.',
      })
    }

    if (image.externalUrl) {
      try {
        const url = new URL(image.externalUrl)

        if (!['http:', 'https:'].includes(url.protocol)) {
          ctx.addIssue({
            code: 'custom',
            path: ['externalUrl'],
            message:
              'La URL externa debe usar http o https.',
          })
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          path: ['externalUrl'],
          message: 'La URL externa no es válida.',
        })
      }
    }
  })

export const replaceProductImagesSchema = z
  .object({
    images: z.array(productImageInputSchema).max(3),
  })
  .superRefine(({ images }, ctx) => {
    const positions = images.map(
      (image) => image.position,
    )

    if (new Set(positions).size !== positions.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['images'],
        message:
          'Las posiciones de las imágenes no pueden repetirse.',
      })
    }
  })

export type ProductImageInput = z.infer<
  typeof productImageInputSchema
>
