import { Router } from 'express'

import {
  addSale,
} from '../controllers/sales.controller.js'

import {
  requireAuth,
} from '../middleware/auth.middleware.js'

const router = Router()

router.post(
  '/',
  requireAuth,
  addSale,
)

export default router
