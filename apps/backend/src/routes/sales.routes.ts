import { Router } from 'express'

import {
  addSale,
  listSales,
} from '../controllers/sales.controller.js'

import {
  requireAuth,
  requireAuthorizedUser,
} from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  requireAuth,
  requireAuthorizedUser,
  listSales,
)

router.post(
  '/',
  requireAuth,
  requireAuthorizedUser,
  addSale,
)

export default router
