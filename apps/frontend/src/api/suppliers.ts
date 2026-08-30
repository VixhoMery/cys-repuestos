import type {
  CreateSupplierInput,
} from '@cys-repuestos/schemas'

import { supabase } from '../lib/supabase'

export type Supplier = {
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
      'crear el proveedor' &&
    error.code === '23505'
  ) {
    message =
      'Ese proveedor ya existe.'
  }

  throw uiError(message)
}

export async function getSuppliers() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_list_suppliers',
    )

  if (error) {
    throwRpcError(
      'cargar los proveedores',
      error,
    )
  }

  return (
    data as Supplier[] | null
  ) ?? []
}

export async function createSupplier(
  input: CreateSupplierInput,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_create_supplier',
      {
        p_name:
          input.name,
      },
    )

  if (error) {
    throwRpcError(
      'crear el proveedor',
      error,
    )
  }

  if (!data) {
    throw uiError(
      'Supabase no devolvió el proveedor creado.',
    )
  }

  return data as Supplier
}

type DeleteSupplierResult =
  | {
      status: 'deleted'
      supplier: {
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

export async function deleteSupplier(
  id: number,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_delete_supplier',
      {
        p_id: id,
      },
    )

  if (error) {
    throwRpcError(
      'eliminar el proveedor',
      error,
    )
  }

  const result =
    data as
      | DeleteSupplierResult
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
      'El proveedor no existe.',
    )
  }

  if (
    result.status ===
    'in-use'
  ) {
    throw uiError(
      result.productCount === 1
        ? 'No puedes eliminar este proveedor porque tiene 1 producto asociado.'
        : `No puedes eliminar este proveedor porque tiene ${result.productCount} productos asociados.`,
    )
  }

  return {
    message:
      'Proveedor eliminado correctamente.',
    supplier:
      result.supplier,
  }
}
