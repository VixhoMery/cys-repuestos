import type {
  CreateProductInput,
  EditProductInput,
  ProductImageInput,
} from '@cys-repuestos/schemas'

import api from './api'
import { supabase } from '../lib/supabase'

export type ProductImage = {
  id: number
  storagePath: string | null
  externalUrl: string | null
  position: number
  url: string
}

export type Product = {
  id: number
  name: string
  brand: string
  sku: string
  category: string
  netPrice: number
  priceWithTax: number
  price: number
  stock: number
  shortDescription: string
  description: string
  createdAt: string
  updatedAt: string
  images: ProductImage[]
  image?: string
}

type ApiProductImage = Omit<ProductImage, 'url'>

type ApiProduct = Omit<Product, 'images' | 'image'> & {
  images?: ApiProductImage[]
}

function resolveProductImageUrl(image: ApiProductImage) {
  if (image.externalUrl) return image.externalUrl

  if (image.storagePath) {
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(image.storagePath)

    return data.publicUrl
  }

  return ''
}

function normalizeProduct(product: ApiProduct): Product {
  const images = [...(product.images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      ...image,
      url: resolveProductImageUrl(image),
    }))
    .filter((image) => image.url)

  return {
    ...product,
    images,
    image: images[0]?.url,
  }
}

export async function getProducts() {
  const response = await api.get<ApiProduct[]>('/products')
  return response.data.map(normalizeProduct)
}

export async function getProductById(id: number) {
  const response = await api.get<ApiProduct>(`/products/${id}`)
  return normalizeProduct(response.data)
}

export async function createProduct(data: CreateProductInput) {
  const response = await api.post<ApiProduct>('/products', data)
  return normalizeProduct(response.data)
}

export async function updateProduct(
  id: number,
  data: EditProductInput,
) {
  const response = await api.patch<ApiProduct>(`/products/${id}`, data)
  return normalizeProduct(response.data)
}

export async function replaceProductImages(
  id: number,
  images: ProductImageInput[],
) {
  await api.put(`/products/${id}/images`, { images })
}

export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`)
}
