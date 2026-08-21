import { Router } from 'express'

import {
  addProduct,
  editProduct,
  showProduct,
  listProducts,
} from '../controllers/products.controller.js'

const router = Router()

router.get(
  '/',
  listProducts,
)

router.get('/:id', showProduct)

router.patch(
  '/:id',
  editProduct,
)

router.post(
  '/',
  addProduct,
)

export default router