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

type RpcErrorLike = {
  message: string
  code?: string
  details?: string
  hint?: string
}

function uiError(
  message: string,
) {
  const error =
    new Error(message) as
      Error & {
        response?: {
          data: {
            message: string
          }
        }
      }

  // ProductForm todavía utiliza el formato
  // error.response.data.message que tenía Axios.
  // Lo conservamos temporalmente para no tocar
  // el componente visual durante la migración.
  error.response = {
    data: {
      message,
    },
  }

  return error
}

function throwRpcError(
  operation: string,
  error: RpcErrorLike,
): never {
  console.error(
    `Error Supabase (${operation}):`,
    error,
  )

  let message =
    error.message ||
    `No fue posible ${operation}.`

  if (
    operation ===
      'crear la categoría' &&
    error.code === '23505'
  ) {
    message =
      'Esa categoría ya existe.'
  }

  throw uiError(message)
}

export async function getCategories() {
  const {
    data,
    error,
  } =
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
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_create_category',
      {
        p_name:
          input.name,
      },
    )

  if (error) {
    throwRpcError(
      'crear la categoría',
      error,
    )
  }

  if (!data) {
    throw uiError(
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
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_delete_category',
      {
        p_id: id,
      },
    )

  if (error) {
    throwRpcError(
      'eliminar la categoría',
      error,
    )
  }

  const result =
    data as
      | DeleteCategoryResult
      | null

  if (!result) {
    throw uiError(
      'Supabase no devolvió el resultado de la eliminación.',
    )
  }

  if (
    result.status ===
    'not-found'
  ) {
    throw uiError(
      'La categoría no existe.',
    )
  }

  if (
    result.status ===
    'in-use'
  ) {
    throw uiError(
      result.productCount === 1
        ? 'No puedes eliminar esta categoría porque tiene 1 producto asociado.'
        : `No puedes eliminar esta categoría porque tiene ${result.productCount} productos asociados.`,
    )
  }

  return {
    message:
      'Categoría eliminada correctamente.',
    category:
      result.category,
  }
}
