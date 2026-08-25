import express from 'express'
import { pool } from './db/pool.js'
import productsRoutes from './routes/products.routes.js'
import salesRoutes from './routes/sales.routes.js'
import helmet from 'helmet'

import {
  corsErrorHandler,
  corsMiddleware,
} from './middleware/security.middleware.js'

import {
  globalErrorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js'

import {
  apiRateLimiter,
} from './middleware/rate-limit.middleware.js'

const app = express()

app.disable('x-powered-by')

app.use(helmet())

app.use(corsMiddleware)

app.use(
  express.json({
    limit: '50kb',
  }),
)


// ------------------------------------
// Health check
// ------------------------------------

app.get(
  '/api/health',
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          'SELECT NOW() AS current_time',
        )

      res.json({
        status: 'ok',
        database: 'connected',
        time:
          result.rows[0].current_time,
      })
    } catch (error) {
      console.error(error)

      res.status(500).json({
        status: 'error',
        database: 'disconnected',
      })
    }
  },
)

app.use(
  '/api',
  apiRateLimiter,
)

// ------------------------------------
// Productos
// ------------------------------------

app.use(
  '/api/products',
  productsRoutes,
)


// ------------------------------------
// Ventas
// ------------------------------------

app.use(
  '/api/sales',
  salesRoutes,
)

app.use(corsErrorHandler)

app.use(notFoundHandler)

app.use(globalErrorHandler)

export default app
