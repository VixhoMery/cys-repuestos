import { Router } from 'express'

import {
  addProduct,
  editProduct,
  showProduct,
  listProducts,
  removeProduct,
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

router.delete(
  '/:id',
  removeProduct,
)

export default router