import { Router } from 'express'

import {
  addCategory,
  listCategories,
} from '../controllers/categories.controller.js'

import {
  requireAuth,
} from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', listCategories)
router.post('/', addCategory)

export default router
