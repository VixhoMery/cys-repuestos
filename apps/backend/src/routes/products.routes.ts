import { Router } from 'express'

import {
  addProduct,
  listProducts,
} from '../controllers/products.controller.js'

const router = Router()

router.get(
  '/',
  listProducts,
)

router.post(
  '/',
  addProduct,
)

export default router