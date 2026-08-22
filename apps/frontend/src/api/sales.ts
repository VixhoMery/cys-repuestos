import api from './api'


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


// ------------------------------------
// Registrar venta
// ------------------------------------

export async function createSale(
  data: CreateSalePayload,
) {
  const response =
    await api.post<CreatedSale>(
      '/sales',
      data,
    )

  return response.data
}


// ------------------------------------
// Obtener ventas
// ------------------------------------

export async function getSales() {
  const response =
    await api.get<Sale[]>(
      '/sales',
    )

  return response.data
}
