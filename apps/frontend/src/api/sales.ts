import type {
  CreateSaleInput,
  PaymentMethod as SchemaPaymentMethod,
} from '@cys-repuestos/schemas'

import { supabase } from '../lib/supabase'


// ============================================================
// MÉTODOS DE PAGO
// ============================================================

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


export const CREDIT_INSTALLMENT_OPTIONS =
  Array.from(
    {
      length: 36,
    },
    (_, index) =>
      index + 1,
  )


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


export function getPaymentDescription(
  paymentMethod:
    | PaymentMethod
    | null
    | undefined,
  installments:
    | number
    | null
    | undefined,
) {
  const label =
    getPaymentMethodLabel(
      paymentMethod,
    )

  if (
    paymentMethod !==
    'credito'
  ) {
    return label
  }

  if (!installments) {
    return `${label} · cuotas no registradas`
  }

  return `${label} · ${installments} ${
    installments === 1
      ? 'cuota'
      : 'cuotas'
  }`
}


// ============================================================
// ITEMS ENVIADOS AL CREAR UNA VENTA
// ============================================================

export type CreateSaleItem =
  CreateSaleInput['items'][number]


export type CreateSalePayload =
  CreateSaleInput


// ============================================================
// TIPOS DEVUELTOS POR POSTGRESQL
// ============================================================

export type SaleItemType =
  | 'inventory'
  | 'temporary'


export type CreatedSaleItem = {
  itemType: SaleItemType

  productId:
    | number
    | null

  productName: string

  netPrice:
    | number
    | null

  priceWithTax:
    | number
    | null

  unitPrice: number

  quantity: number

  subtotal: number
}


export type CreatedSale = {
  id: number

  sellerId: string

  sellerEmail:
    | string
    | null

  soldAt: string

  total: number

  paymentMethod:
    PaymentMethod

  installments:
    | number
    | null

  items:
    CreatedSaleItem[]
}


export type SaleItem = {
  productId:
    | number
    | null

  itemType:
    SaleItemType

  name: string

  netPrice:
    | number
    | null

  priceWithTax:
    | number
    | null

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

  installments:
    | number
    | null

  items:
    SaleItem[]
}


// ============================================================
// COMPROBANTE
//
// Se conserva simple para no alterar el diseño actual.
// itemType queda disponible para distinguir visualmente
// productos temporales si más adelante se desea.
// ============================================================

export type ReceiptSale = {
  id: number

  seller: string

  soldAt: string

  total: number

  paymentMethod:
    | PaymentMethod
    | null

  installments:
    | number
    | null

  items: Array<{
    itemType:
      SaleItemType

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

    soldAt:
      sale.soldAt,

    total:
      sale.total,

    paymentMethod:
      sale.paymentMethod,

    installments:
      sale.installments,

    items:
      sale.items.map(
        (item) => ({
          itemType:
            item.itemType,

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
    id:
      sale.id,

    seller:
      sale.seller,

    soldAt:
      sale.soldAt,

    total:
      sale.total,

    paymentMethod:
      sale.paymentMethod,

    installments:
      sale.installments,

    items:
      sale.items.map(
        (item) => ({
          itemType:
            item.itemType,

          name:
            item.name,

          quantity:
            item.quantity,

          unitPrice:
            item.unitPrice,
        }),
      ),
  }
}


// ============================================================
// CACHE
// ============================================================

const SALES_CACHE_TTL_MS =
  10_000


let salesCache:
  | {
      data: Sale[]
      expiresAt: number
    }
  | null =
  null


let salesRequest:
  | Promise<Sale[]>
  | null =
  null


const salesRangeCache =
  new Map<
    string,
    {
      data: Sale[]
      expiresAt: number
    }
  >()


const salesRangeRequests =
  new Map<
    string,
    Promise<Sale[]>
  >()


export function invalidateSalesCache() {
  salesCache = null
  salesRequest = null

  salesRangeCache.clear()
  salesRangeRequests.clear()
}


// ============================================================
// ERRORES RPC
// ============================================================

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


// ============================================================
// CREAR VENTA
// ============================================================

export async function createSale(
  input: CreateSalePayload,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'cys_create_sale',
      {
        p_items:
          input.items,

        p_payment_method:
          input.paymentMethod,

        p_installments:
          input.paymentMethod ===
          'credito'
            ? input.installments
            : null,
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

  invalidateSalesCache()

  return data as CreatedSale
}


// ============================================================
// LISTAR VENTAS
// ============================================================

export async function getSales() {
  const now =
    Date.now()

  if (
    salesCache &&
    salesCache.expiresAt >
      now
  ) {
    return salesCache.data
  }

  if (salesRequest) {
    return salesRequest
  }

  salesRequest =
    (async () => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          'cys_list_sales',
        )

      if (error) {
        throwRpcError(
          'cargar las ventas',
          error,
        )
      }

      const sales =
        (
          data as
            | Sale[]
            | null
        ) ?? []

      salesCache = {
        data:
          sales,

        expiresAt:
          Date.now() +
          SALES_CACHE_TTL_MS,
      }

      return sales
    })()

  try {
    return await salesRequest
  } finally {
    salesRequest = null
  }
}


// ============================================================
// VENTAS POR RANGO
// ============================================================

export async function getSalesRange(
  start: Date,
  end: Date,
) {
  if (
    Number.isNaN(
      start.getTime(),
    ) ||
    Number.isNaN(
      end.getTime(),
    ) ||
    start >= end
  ) {
    throw new Error(
      'El rango de fechas no es válido.',
    )
  }


  const startIso =
    start.toISOString()

  const endIso =
    end.toISOString()

  const key =
    `${startIso}|${endIso}`

  const now =
    Date.now()

  const cached =
    salesRangeCache.get(
      key,
    )


  if (
    cached &&
    cached.expiresAt >
      now
  ) {
    return cached.data
  }


  const pending =
    salesRangeRequests.get(
      key,
    )

  if (pending) {
    return pending
  }


  const request =
    (async () => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          'cys_list_sales_range',
          {
            p_start:
              startIso,

            p_end:
              endIso,
          },
        )

      if (error) {
        throwRpcError(
          'cargar las ventas del período',
          error,
        )
      }


      const sales =
        (
          data as
            | Sale[]
            | null
        ) ?? []


      salesRangeCache.set(
        key,
        {
          data:
            sales,

          expiresAt:
            Date.now() +
            SALES_CACHE_TTL_MS,
        },
      )


      return sales
    })()


  salesRangeRequests.set(
    key,
    request,
  )


  try {
    return await request
  } finally {
    salesRangeRequests.delete(
      key,
    )
  }
}
