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

type ErrorLike = {
  message?: unknown
  error?: unknown
  statusCode?: unknown
  name?: unknown
}

export function getProductImageErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const candidate = error as ErrorLike

    const message =
      typeof candidate.message === 'string'
        ? candidate.message
        : typeof candidate.error === 'string'
          ? candidate.error
          : null

    const statusCode =
      typeof candidate.statusCode === 'string' ||
      typeof candidate.statusCode === 'number'
        ? String(candidate.statusCode)
        : null

    if (message && statusCode) {
      return `${message} (código ${statusCode})`
    }

    if (message) return message
  }

  return 'Error desconocido al procesar la imagen.'
}

async function assertAuthenticatedForStorage() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(
      `No fue posible comprobar la sesión de Supabase: ${getProductImageErrorMessage(error)}`,
    )
  }

  if (!session) {
    throw new Error(
      'No hay una sesión autenticada de Supabase. Cierra sesión, vuelve a ingresar e intenta subir la imagen nuevamente.',
    )
  }

  return session
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

      const session = await assertAuthenticatedForStorage()
      const extension = getExtension(image.file)
      const path = `products/${productId}/${crypto.randomUUID()}.${extension}`

      console.info('[product-images] Intentando subir archivo', {
        bucket: BUCKET,
        path,
        fileName: image.file.name,
        fileType: image.file.type,
        fileSizeBytes: image.file.size,
        fileSizeMB: Number((image.file.size / 1024 / 1024).toFixed(2)),
        userId: session.user.id,
      })

      const {
        data,
        error,
      } = await supabase.storage
        .from(BUCKET)
        .upload(path, image.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: image.file.type,
        })

      if (error) {
        const detail = getProductImageErrorMessage(error)

        console.error('[product-images] Supabase Storage rechazó el archivo', {
          bucket: BUCKET,
          path,
          fileName: image.file.name,
          fileType: image.file.type,
          fileSizeBytes: image.file.size,
          storageError: error,
        })

        throw new Error(
          `No se pudo subir "${image.file.name}" a Supabase Storage: ${detail}`,
        )
      }

      console.info('[product-images] Archivo subido correctamente', {
        bucket: BUCKET,
        requestedPath: path,
        storageResponse: data,
      })

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
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET)
        .remove(uploadedPaths)

      if (cleanupError) {
        console.error(
          '[product-images] También falló la limpieza de archivos parciales:',
          cleanupError,
        )
      }
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

  if (error) {
    console.error('[product-images] Error eliminando archivos de Storage', {
      bucket: BUCKET,
      paths,
      storageError: error,
    })

    throw new Error(
      `No fue posible eliminar imágenes de Supabase Storage: ${getProductImageErrorMessage(error)}`,
    )
  }
}
