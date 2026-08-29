import type {
  CreateCategoryInput,
} from '@cys-repuestos/schemas'

import { supabase } from '../lib/supabase'

export type Category = {
  id: number
  name: string
  createdAt: string
  productCount: number
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

export async function getCategories() {
  const { data, error } =
    await supabase.rpc(
      'cys_list_categories',
    )

  if (error) {
    throwRpcError(
      'cargar las categorías',
      error,
    )
  }

  return (
    data as Category[] | null
  ) ?? []
}

export async function createCategory(
  input: CreateCategoryInput,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_create_category',
      { p_name: input.name },
    )

  if (error) {
    throwRpcError(
      'crear la categoría',
      error,
    )
  }

  if (!data) {
    throw new Error(
      'Supabase no devolvió la categoría creada.',
    )
  }

  return data as Category
}

type DeleteCategoryResult =
  | {
      status: 'deleted'
      category: {
        id: number
        name: string
      }
    }
  | {
      status: 'not-found'
    }
  | {
      status: 'in-use'
      productCount: number
    }

export async function deleteCategory(
  id: number,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_delete_category',
      { p_id: id },
    )

  if (error) {
    throwRpcError(
      'eliminar la categoría',
      error,
    )
  }

  const result =
    data as DeleteCategoryResult | null

  if (!result) {
    throw new Error(
      'Supabase no devolvió el resultado de la eliminación.',
    )
  }

  if (result.status === 'not-found') {
    throw new Error(
      'La categoría no existe.',
    )
  }

  if (result.status === 'in-use') {
    throw new Error(
      result.productCount === 1
        ? 'No puedes eliminar esta categoría porque tiene 1 producto asociado.'
        : `No puedes eliminar esta categoría porque tiene ${result.productCount} productos asociados.`,
    )
  }

  return {
    message:
      'Categoría eliminada correctamente.',
    category: result.category,
  }
}
