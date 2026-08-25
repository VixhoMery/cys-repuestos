import {
  rateLimit,
} from 'express-rate-limit'

// ------------------------------------
// Límite general de API
// ------------------------------------
//
// Bastante amplio para uso interno normal.
// 600 solicitudes cada 15 minutos por IP.
//
export const apiRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 600,

    standardHeaders:
      'draft-8',

    legacyHeaders: false,

    message: {
      message:
        'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
    },
  })


// ------------------------------------
// Límite de operaciones de escritura
// ------------------------------------
//
// Crear / editar / borrar no debería
// ocurrir cientos de veces por minuto.
//
export const writeRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 120,

    standardHeaders:
      'draft-8',

    legacyHeaders: false,

    message: {
      message:
        'Demasiadas operaciones. Intenta nuevamente en unos minutos.',
    },
  })
