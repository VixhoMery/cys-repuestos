import type {
  CreateSaleInput,
  PaymentMethod as SchemaPaymentMethod,
} from '@cys-repuestos/schemas'

import { supabase } from '../lib/supabase'

export type PaymentMethod =
  SchemaPaymentMethod

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod
  label: string
}> = [
  {
    value: 'efectivo',
    label: 'Efectivo',
  },
  {
    value: 'debito',
    label: 'Débito',
  },
  {
    value: 'credito',
    label: 'Crédito',
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
  },
  {
    value: 'otro',
    label: 'Otro',
  },
]

export function getPaymentMethodLabel(
  paymentMethod:
    | PaymentMethod
    | null
    | undefined,
) {
  if (!paymentMethod) {
    return 'No registrado'
  }

  return (
    PAYMENT_METHOD_OPTIONS.find(
      (option) =>
        option.value ===
        paymentMethod,
    )?.label ??
    'No registrado'
  )
}

export type CreateSaleItem = {
  productId: number
  quantity: number
}

export type CreateSalePayload =
  CreateSaleInput

export type CreatedSale = {
  id: number
  sellerId: string
  sellerEmail: string | null
  soldAt: string
  total: number
  paymentMethod: PaymentMethod
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
  paymentMethod:
    | PaymentMethod
    | null
  items: SaleItem[]
}

export type ReceiptSale = {
  id: number
  seller: string
  soldAt: string
  total: number
  paymentMethod:
    | PaymentMethod
    | null
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
}

export function createdSaleToReceiptSale(
  sale: CreatedSale,
): ReceiptSale {
  return {
    id: sale.id,
    seller:
      sale.sellerEmail ??
      'Usuario',
    soldAt: sale.soldAt,
    total: sale.total,
    paymentMethod:
      sale.paymentMethod,
    items: sale.items.map(
      (item) => ({
        name:
          item.productName,
        quantity:
          item.quantity,
        unitPrice:
          item.unitPrice,
      }),
    ),
  }
}

export function saleToReceiptSale(
  sale: Sale,
): ReceiptSale {
  return {
    id: sale.id,
    seller: sale.seller,
    soldAt: sale.soldAt,
    total: sale.total,
    paymentMethod:
      sale.paymentMethod,
    items: sale.items.map(
      (item) => ({
        name: item.name,
        quantity:
          item.quantity,
        unitPrice:
          item.unitPrice,
      }),
    ),
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

export async function createSale(
  input: CreateSalePayload,
) {
  const { data, error } =
    await supabase.rpc(
      'cys_create_sale',
      {
        p_items:
          input.items,
        p_payment_method:
          input.paymentMethod,
      },
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
