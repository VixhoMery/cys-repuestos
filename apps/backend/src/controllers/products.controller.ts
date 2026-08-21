import type {
  Request,
  Response,
} from 'express'

import {
  createProductSchema,
  editProductSchema,
} from '@cys-repuestos/schemas'

import {
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
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

export async function showProduct(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message:
          'El ID del producto no es válido',
      })
    }

    const product =
      await getProductById(id)

    if (!product) {
      return res.status(404).json({
        message:
          'Producto no encontrado',
      })
    }

    return res.json(product)
  } catch (error) {
    console.error(
      'Error obteniendo producto:',
      error,
    )

    return res.status(500).json({
      message:
        'Error al obtener el producto',
    })
  }
}

// ------------------------------------
// Editar producto
// ------------------------------------

export async function editProduct(
  req: Request,
  res: Response,
) {
  try {
    const id = Number(req.params.id)

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          'El ID del producto no es válido',
      })
    }

    const validation =
      editProductSchema.safeParse(
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
      await updateProduct(
        id,
        validation.data,
      )

    if (!product) {
      return res.status(404).json({
        message:
          'Producto no encontrado',
      })
    }

    return res.json(product)
  } catch (error) {
    console.error(
      'Error editando producto:',
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
        'Error al editar el producto',
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