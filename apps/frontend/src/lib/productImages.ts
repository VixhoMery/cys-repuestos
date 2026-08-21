import { supabase } from './supabase'

import type {
  ProductImageInput,
} from '@cys-repuestos/schemas'

export type ProductFormImage =
  | {
      type: 'file'
      file: File
      previewUrl: string
    }
  | {
      type: 'external'
      externalUrl: string
      previewUrl: string
    }
  | {
      type: 'existing'
      id: number
      storagePath: string | null
      externalUrl: string | null
      previewUrl: string
    }

const BUCKET = 'product-images'

function getExtension(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export async function prepareProductImages(
  productId: number,
  images: ProductFormImage[],
) {
  const metadata: ProductImageInput[] = []
  const uploadedPaths: string[] = []

  try {
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]
      const position = index + 1

      if (image.type === 'existing') {
        metadata.push({
          storagePath: image.storagePath,
          externalUrl: image.externalUrl,
          position,
        })
        continue
      }

      if (image.type === 'external') {
        metadata.push({
          storagePath: null,
          externalUrl: image.externalUrl,
          position,
        })
        continue
      }

      const extension = getExtension(image.file)
      const path = `products/${productId}/${crypto.randomUUID()}.${extension}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, image.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: image.file.type,
        })

      if (error) throw error

      uploadedPaths.push(path)
      metadata.push({
        storagePath: path,
        externalUrl: null,
        position,
      })
    }

    return { metadata, uploadedPaths }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(uploadedPaths)
    }
    throw error
  }
}

export async function removeStorageImages(
  paths: string[],
) {
  if (paths.length === 0) return

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(paths)

  if (error) throw error
}
