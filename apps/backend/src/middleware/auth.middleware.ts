import type {
  NextFunction,
  Request,
  Response,
} from 'express'

export type AuthUser = {
  id: string
  email: string | null
}

export interface AuthenticatedRequest
  extends Request {
  authUser?: AuthUser
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        message:
          'Debes iniciar sesión para realizar esta acción.',
      })
    }

    const token =
      authorization.slice('Bearer '.length)

    const supabaseUrl =
      process.env.SUPABASE_URL

    const publishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY

    if (
      !supabaseUrl ||
      !publishableKey
    ) {
      console.error(
        'Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en el backend.',
      )

      return res.status(500).json({
        message:
          'La autenticación del servidor no está configurada.',
      })
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: publishableKey,
          Authorization:
            `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      return res.status(401).json({
        message:
          'La sesión no es válida o ha expirado.',
      })
    }

    const user = await response.json() as {
      id?: string
      email?: string | null
    }

    if (!user.id) {
      return res.status(401).json({
        message:
          'No fue posible identificar al usuario.',
      })
    }

    req.authUser = {
      id: user.id,
      email: user.email ?? null,
    }

    next()
  } catch (error) {
    console.error(
      'Error verificando autenticación:',
      error,
    )

    return res.status(500).json({
      message:
        'Error verificando la sesión.',
    })
  }
}
