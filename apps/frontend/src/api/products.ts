import type {
  CreateProductInput,
} from '@cys-repuestos/schemas'

import api from './api'


export type Product = {
  id: number
  name: string
  brand: string
  sku: string
  category: string
  price: number
  stock: number
  shortDescription: string
  description: string
  createdAt: string
  updatedAt: string
}


// ------------------------------------
// Obtener productos
// ------------------------------------

export async function getProducts() {
  const response =
    await api.get<Product[]>(
      '/products',
    )

  return response.data
}


// ------------------------------------
// Crear producto
// ------------------------------------

export async function createProduct(
  data: CreateProductInput,
) {
  const response =
    await api.post<Product>(
      '/products',
      data,
    )

  return response.data
}