import { Router } from 'express'

import {
  addProduct,
  editProduct,
  listProducts,
  removeProduct,
  saveProductImages,
  showProduct,
} from '../controllers/products.controller.js'

const router = Router()

router.get('/', listProducts)
router.get('/:id', showProduct)
router.post('/', addProduct)
router.patch('/:id', editProduct)
router.put('/:id/images', saveProductImages)
router.delete('/:id', removeProduct)

export default router
