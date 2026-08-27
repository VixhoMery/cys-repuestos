import { Router } from 'express'

import {
  addCategory,
  listCategories,
  removeCategory,
} from '../controllers/categories.controller.js'

import {
  requireAuth,
  requireAuthorizedUser,
} from '../middleware/auth.middleware.js'

import {
  writeRateLimiter,
} from '../middleware/rate-limit.middleware.js'


const router = Router()

router.use(
  requireAuth,
  requireAuthorizedUser,
)

router.get(
  '/',
  listCategories,
)

router.post(
  '/',
  writeRateLimiter,
  addCategory,
)

router.delete(
  '/:id',
  writeRateLimiter,
  removeCategory,
)


export default router
