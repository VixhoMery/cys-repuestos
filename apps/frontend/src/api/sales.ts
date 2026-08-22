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
