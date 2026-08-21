import type {
  Request,
  Response,
} from 'express'

import {
  createProductSchema,
} from '@cys-repuestos/schemas'

import {
  createProduct,
  getProducts,
} from '../services/products.service.js'


// ------------------------------------
// Listar productos
// ------------------------------------

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


// ------------------------------------
// Crear producto
// ------------------------------------

export async function addProduct(
  req: Request,
  res: Response,
) {
  try {
    const validation =
      createProductSchema.safeParse(
        req.body,
      )

    if (!validation.success) {
      return res.status(400).json({
        message:
          'Los datos del producto no son válidos',
        errors:
          validation.error.flatten(),
      })
    }

    const product =
      await createProduct(
        validation.data,
      )

    return res
      .status(201)
      .json(product)
  } catch (error) {
    console.error(
      'Error creando producto:',
      error,
    )

    // SKU duplicado
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      return res.status(409).json({
        message:
          'Ya existe un producto con ese SKU',
      })
    }

    return res.status(500).json({
      message:
        'Error al crear el producto',
    })
  }
}