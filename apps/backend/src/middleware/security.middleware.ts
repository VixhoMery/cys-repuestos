import cors from 'cors'
import type {
  CorsOptions,
} from 'cors'
import type {
  ErrorRequestHandler,
} from 'express'


class CorsOriginError extends Error {
  statusCode = 403

  constructor() {
    super(
      'Origen no permitido por CORS',
    )

    this.name =
      'CorsOriginError'
  }
}


function getAllowedOrigins() {
  const origins =
    new Set<string>([
      'http://localhost:5173',
    ])

  const frontendUrl =
    process.env.FRONTEND_URL?.trim()

  if (frontendUrl) {
    origins.add(frontendUrl)
  }

  return origins
}


const allowedOrigins =
  getAllowedOrigins()


export const corsOptions:
  CorsOptions = {
    origin(origin, callback) {
      if (!origin) {
        return callback(
          null,
          true,
        )
      }

      if (
        allowedOrigins.has(origin)
      ) {
        return callback(
          null,
          true,
        )
      }

      return callback(
        new CorsOriginError(),
      )
    },

    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    credentials: false,

    maxAge: 600,
  }


export const corsMiddleware =
  cors(corsOptions)


export const corsErrorHandler:
  ErrorRequestHandler = (
    error,
    _req,
    res,
    next,
  ) => {
    if (
      error instanceof
        CorsOriginError ||
      (
        error instanceof Error &&
        error.message ===
          'Origen no permitido por CORS'
      )
    ) {
      res.status(403).json({
        message:
          'Origen no permitido.',
      })

      return
    }

    next(error)
  }
