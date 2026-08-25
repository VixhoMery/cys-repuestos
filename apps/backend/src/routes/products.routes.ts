import { Router } from 'express'

import {
  addProduct,
  editProduct,
  listProducts,
  removeProduct,
  saveProductImages,
  showProduct,
} from '../controllers/products.controller.js'

import {
  requireAuth,
} from '../middleware/auth.middleware.js'

import categoriesRoutes from './categories.routes.js'


const router = Router()


// ------------------------------------
// Categorías
// ------------------------------------
// categoriesRoutes ya exige autenticación.
// Debe ir antes de /:id para que "categories"
// no se interprete como un ID de producto.
router.use(
  '/categories',
  categoriesRoutes,
)


// ------------------------------------
// Proteger TODAS las rutas de productos
// ------------------------------------
//
// A partir de aquí ningún endpoint de producto
// puede ejecutarse sin un JWT válido de Supabase.
router.use(requireAuth)


router.get(
  '/',
  listProducts,
)

router.get(
  '/:id',
  showProduct,
)

router.post(
  '/',
  addProduct,
)

router.patch(
  '/:id',
  editProduct,
)

router.put(
  '/:id/images',
  saveProductImages,
)

router.delete(
  '/:id',
  removeProduct,
)


export default router
