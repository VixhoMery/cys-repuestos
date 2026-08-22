import { Router } from 'express'

import {
  addSale,
  listSales,
} from '../controllers/sales.controller.js'

import {
  requireAuth,
} from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  requireAuth,
  listSales,
)

router.post(
  '/',
  requireAuth,
  addSale,
)

export default router
