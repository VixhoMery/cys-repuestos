import express from 'express'
import cors from 'cors'
import { pool } from './db/pool.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() AS current_time',
    )

    res.json({
      status: 'ok',
      database: 'connected',
      time: result.rows[0].current_time,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    })
  }
})

export default app