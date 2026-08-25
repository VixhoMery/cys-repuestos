import express from 'express'
import { pool } from './db/pool.js'
import productsRoutes from './routes/products.routes.js'
import salesRoutes from './routes/sales.routes.js'
import helmet from 'helmet'

import {
  corsErrorHandler,
  corsMiddleware,
} from './middleware/security.middleware.js'



const app = express()

app.disable('x-powered-by')

app.use(helmet())

app.use(corsMiddleware)

app.use(express.json())


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

export default app
