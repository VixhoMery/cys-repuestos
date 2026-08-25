import type {
  CreateCategoryInput,
} from '@cys-repuestos/schemas'

import api from './api'

export type Category = {
  id: number
  name: string
  createdAt: string
}

export async function getCategories() {
  const response =
    await api.get<Category[]>(
      '/products/categories',
    )

  return response.data
}

export async function createCategory(
  data: CreateCategoryInput,
) {
  const response =
    await api.post<Category>(
      '/products/categories',
      data,
    )

  return response.data
}
