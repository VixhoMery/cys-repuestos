import type {
  CreateProductInput,
  EditProductInput,
  ProductImageInput,
} from '@cys-repuestos/schemas'

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
  supplierId: number | null
  supplierName: string | null
  location: string | null
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

type ApiProductImage =
  Omit<ProductImage, 'url'>

type ApiProduct =
  Omit<Product, 'images' | 'image'> & {
    images?: ApiProductImage[]
  }

function resolveProductImageUrl(
  image: ApiProductImage,
) {
  if (image.externalUrl) {
    return image.externalUrl
  }

  if (image.storagePath) {
    const { data } =
      supabase.storage
        .from('product-images')
        .getPublicUrl(image.storagePath)

    return data.publicUrl
  }

  return ''
}

function normalizeProduct(
  product: ApiProduct,
): Product {
  const images =
    [...(product.images ?? [])]
      .sort((a, b) =>
        a.position - b.position,
      )
      .map((image) => ({
        ...image,
        url: resolveProductImageUrl(image),
      }))
      .filter((image) => image.url)

  return {
    ...product,
    supplierId:
      product.supplierId ?? null,
    supplierName:
      product.supplierName ?? null,
    location:
      product.location ?? null,
    images,
    image: images[0]?.url,
  }
}

function throwRpcError(
  operation: string,
  error: {
    message: string
    code?: string
    details?: string
    hint?: string
  },
): never {
  console.error(
    `Error Supabase (${operation}):`,
    error,
  )

  throw new Error(
    error.message ||
      `No fue posible ${operation}.`,
  )
}

export type ProductPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type ProductListResponse = {
  data: Product[]
  pagination: ProductPagination
}

export type GetProductsParams = {
  page?: number
  limit?: number
  search?: string
  category?: string
}

type ApiProductListResponse = {
  data: ApiProduct[]
  pagination: ProductPagination
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<ProductListResponse> {
  const { data, error } =
    await supabase.rpc(
      'cys_list_products',
      {
        p_page: params.page ?? 1,
        p_limit: params.limit ?? 25,
        p_search:
          params.search?.trim() || null,
        p_category:
          params.category?.trim() || null,
      },
    )

  if (error) {
    throwRpcError(
      'cargar los productos',
      error,
    )
  }

  const result =
    data as ApiProductListResponse | null

  if (!result) {
    throw new Error(
      'Supabase no devolvió el catálogo.',
    )
  }

  return {
    data: result.data.map(
      normalizeProduct,
    ),
    pagination: result.pagination,
  }
}

export async function getProductById(
  id: number,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_get_product',
      { p_id: id },
    )

  if (error) {
    throwRpcError(
      'cargar el producto',
      error,
    )
  }

  if (!data) {
    throw new Error(
      'El producto no existe.',
    )
  }

  return normalizeProduct(
    data as ApiProduct,
  )
}

export async function createProduct(
  product: CreateProductInput,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_create_product',
      {
        p_name: product.name,
        p_brand: product.brand,
        p_sku: product.sku,
        p_category: product.category,
        p_supplier_id:
          product.supplierId ?? null,
        p_location:
          product.location?.trim() || null,
        p_net_price: product.netPrice,
        p_price: product.price,
        p_stock: product.stock,
        p_short_description:
          product.shortDescription,
        p_description:
          product.description,
      },
    )

  if (error) {
    throwRpcError(
      'crear el producto',
      error,
    )
  }

  if (!data) {
    throw new Error(
      'Supabase no devolvió el producto creado.',
    )
  }

  return normalizeProduct(
    data as ApiProduct,
  )
}

export async function updateProduct(
  id: number,
  product: EditProductInput,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_update_product',
      {
        p_id: id,
        p_name: product.name,
        p_brand: product.brand,
        p_sku: product.sku,
        p_category: product.category,
        p_supplier_id:
          product.supplierId ?? null,
        p_location:
          product.location?.trim() || null,
        p_net_price: product.netPrice,
        p_price: product.price,
        p_stock: product.stock,
        p_short_description:
          product.shortDescription,
        p_description:
          product.description,
      },
    )

  if (error) {
    throwRpcError(
      'editar el producto',
      error,
    )
  }

  if (!data) {
    throw new Error(
      'El producto no existe.',
    )
  }

  return normalizeProduct(
    data as ApiProduct,
  )
}

export async function replaceProductImages(
  id: number,
  images: ProductImageInput[],
) {
  const { error } =
    await supabase.rpc(
      'cys_replace_product_images',
      {
        p_product_id: id,
        p_images: images,
      },
    )

  if (error) {
    throwRpcError(
      'guardar las imágenes',
      error,
    )
  }
}

export async function deleteProduct(
  id: number,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_delete_product',
      { p_id: id },
    )

  if (error) {
    throwRpcError(
      'eliminar el producto',
      error,
    )
  }

  if (data !== true) {
    throw new Error(
      'El producto no existe.',
    )
  }
}
