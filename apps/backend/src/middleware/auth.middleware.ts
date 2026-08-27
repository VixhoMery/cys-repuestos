import type {
  NextFunction,
  Request,
  Response,
} from 'express'

import { pool } from '../db/pool.js'

export type AuthUser = {
  id: string
  email: string | null
  profile?: {
    fullName: string
    role: 'admin' | 'vendedor' | 'bodega'
    accountType: 'pending' | 'owner' | 'developer'
    active: boolean
  }
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

export async function requireAuthorizedUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authUser = req.authUser

    if (!authUser) {
      return res.status(401).json({
        message:
          'Debes iniciar sesión para realizar esta acción.',
      })
    }

    const result = await pool.query<{
      full_name: string
      role: 'admin' | 'vendedor' | 'bodega'
      account_type: 'pending' | 'owner' | 'developer'
      active: boolean
    }>(
      `
        SELECT
          full_name,
          role,
          account_type,
          active
        FROM public.profiles
        WHERE id = $1
        LIMIT 1
      `,
      [authUser.id],
    )

    const profile = result.rows[0]

    if (!profile) {
      return res.status(403).json({
        message:
          'Tu cuenta no está autorizada para acceder al sistema.',
      })
    }

    if (!profile.active) {
      return res.status(403).json({
        message:
          'Tu cuenta todavía no está habilitada para acceder al sistema.',
      })
    }

    if (
      profile.account_type !== 'owner' &&
      profile.account_type !== 'developer'
    ) {
      return res.status(403).json({
        message:
          'Tu cuenta no está autorizada para acceder al sistema.',
      })
    }

    authUser.profile = {
      fullName: profile.full_name,
      role: profile.role,
      accountType: profile.account_type,
      active: profile.active,
    }

    next()
  } catch (error) {
    console.error(
      'Error verificando autorización:',
      error,
    )

    return res.status(500).json({
      message:
        'Error verificando los permisos de acceso.',
    })
  }
}
