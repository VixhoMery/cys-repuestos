import { supabase } from '../lib/supabase'

export type CreateSaleItem = {
  productId: number
  quantity: number
}

export type CreateSalePayload = {
  items: CreateSaleItem[]
}

export type CreatedSale = {
  id: number
  sellerId: string
  sellerEmail: string | null
  soldAt: string
  total: number
  items: Array<{
    productId: number
    productName: string
    unitPrice: number
    quantity: number
    subtotal: number
  }>
}

export type SaleItem = {
  productId: number | null
  name: string
  quantity: number
  unitPrice: number
}

export type Sale = {
  id: number
  seller: string
  soldAt: string
  total: number
  items: SaleItem[]
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

export async function createSale(
  input: CreateSalePayload,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_create_sale',
      { p_items: input.items },
    )

  if (error) {
    throwRpcError(
      'registrar la venta',
      error,
    )
  }

  if (!data) {
    throw new Error(
      'Supabase no devolvió la venta creada.',
    )
  }

  return data as CreatedSale
}

export async function getSales() {
  const { data, error } =
    await supabase.rpc(
      'cys_list_sales',
    )

  if (error) {
    throwRpcError(
      'cargar las ventas',
      error,
    )
  }

  return (
    data as Sale[] | null
  ) ?? []
}
