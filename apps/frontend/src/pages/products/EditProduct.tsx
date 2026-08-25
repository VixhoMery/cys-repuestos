import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router'

import ProductForm from '../../components/products/ProductForm'

import type {
  EditProductInput,
} from '@cys-repuestos/schemas'

import {
  getProductById,
  replaceProductImages,
  updateProduct,
  type Product,
} from '../../api/products'

import {
  prepareProductImages,
  removeStorageImages,
  type ProductFormImage,
} from '../../lib/productImages'

function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [product, setProduct] =
    useState<Product | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      const productId = Number(id)

      if (!Number.isInteger(productId) || productId <= 0) {
        setLoading(false)
        return
      }

      try {
        const data = await getProductById(productId)
        setProduct(data)
      } catch (error) {
        console.error('Error cargando producto:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const handleEditProduct = async (
    data: EditProductInput,
    images: ProductFormImage[],
  ) => {
    const productId = Number(id)

    if (!product) return

    let uploadedPaths: string[] = []

    try {
      await updateProduct(productId, data)

      const prepared = await prepareProductImages(productId, images)
      uploadedPaths = prepared.uploadedPaths

      await replaceProductImages(productId, prepared.metadata)

      const retainedStoragePaths = new Set(
        prepared.metadata
          .map((image) => image.storagePath)
          .filter((path): path is string => path !== null),
      )

      const removedStoragePaths = product.images
        .map((image) => image.storagePath)
        .filter(
          (path): path is string =>
            path !== null && !retainedStoragePaths.has(path),
        )

      if (removedStoragePaths.length > 0) {
        try {
          await removeStorageImages(removedStoragePaths)
        } catch (cleanupError) {
          console.error(
            'No fue posible borrar archivos antiguos del Storage:',
            cleanupError,
          )
        }
      }

      navigate(`/productos/${productId}`)
    } catch (error) {
      console.error('Error editando producto:', error)

      if (uploadedPaths.length > 0) {
        try {
          await removeStorageImages(uploadedPaths)
        } catch (cleanupError) {
          console.error('No fue posible limpiar las imágenes nuevas:', cleanupError)
        }
      }
    }
  }

  if (loading) {
    return <p>Cargando producto...</p>
  }

  if (!product) {
    return <p>Producto no encontrado.</p>
  }

  const initialImages: ProductFormImage[] = product.images.map((image) => ({
    type: 'existing',
    id: image.id,
    storagePath: image.storagePath,
    externalUrl: image.externalUrl,
    previewUrl: image.url,
  }))

  return (
    <ProductForm
      mode="edit"
      defaultValues={{
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        category: product.category,
        netPrice: product.netPrice,
        price: product.price,
        stock: product.stock,
        shortDescription: product.shortDescription,
        description: product.description,
      }}
      initialImages={initialImages}
      onSubmit={handleEditProduct}
    />
  )
}

export default EditProduct
