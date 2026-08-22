import type {
  Response,
} from 'express'

import {
  createSaleSchema,
} from '@cys-repuestos/schemas'

import type {
  AuthenticatedRequest,
} from '../middleware/auth.middleware.js'

import {
  createSale,
  SaleError,
} from '../services/sales.service.js'


// ------------------------------------
// Registrar venta
// ------------------------------------

export async function addSale(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.authUser) {
      return res.status(401).json({
        message:
          'Usuario no autenticado.',
      })
    }

    const validation =
      createSaleSchema.safeParse(
        req.body,
      )

    if (!validation.success) {
      return res.status(400).json({
        message:
          'Los datos de la venta no son válidos.',
        errors:
          validation.error.flatten(),
      })
    }

    const sale =
      await createSale(
        req.authUser,
        validation.data,
      )

    return res
      .status(201)
      .json(sale)
  } catch (error) {
    if (error instanceof SaleError) {
      return res
        .status(error.status)
        .json({
          message: error.message,
        })
    }

    console.error(
      'Error registrando venta:',
      error,
    )

    return res.status(500).json({
      message:
        'No fue posible registrar la venta.',
    })
  }
}
