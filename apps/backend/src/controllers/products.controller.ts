import type {
  Request,
  Response,
} from 'express'

import {
  getProducts,
} from '../services/products.service.js'


export async function listProducts(
  _req: Request,
  res: Response,
) {
  try {
    const products =
      await getProducts()

    return res.json(products)
  } catch (error) {
    console.error(
      'Error obteniendo productos:',
      error,
    )

    return res.status(500).json({
      message:
        'Error al obtener los productos',
    })
  }
}