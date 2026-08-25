import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express'


// ------------------------------------
// 404 limpio
// ------------------------------------

export const notFoundHandler:
  RequestHandler = (
    _req,
    res,
  ) => {
    res.status(404).json({
      message:
        'Ruta no encontrada.',
    })
  }


// ------------------------------------
// Error global
// ------------------------------------
//
// Nunca enviamos stack traces,
// rutas del servidor ni detalles
// internos al cliente.
//
export const globalErrorHandler:
  ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
  ) => {
    console.error(error)

    // JSON demasiado grande
    if (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      error.type ===
        'entity.too.large'
    ) {
      res.status(413).json({
        message:
          'La solicitud es demasiado grande.',
      })

      return
    }

    // JSON inválido
    if (
      error instanceof
        SyntaxError &&
      'body' in error
    ) {
      res.status(400).json({
        message:
          'El JSON enviado no es válido.',
      })

      return
    }

    res.status(500).json({
      message:
        'Ocurrió un error interno.',
    })
  }
