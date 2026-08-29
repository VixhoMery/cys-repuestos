import { supabase } from '../lib/supabase'

export type RegisterOwnerResponse = {
  message: string
  profile?: {
    id: string
    fullName: string
    role: 'admin'
    accountType: 'owner'
    active: true
  }
  ownersUsed?: number
  ownersLimit?: number
  accountType?: 'owner' | 'developer'
}

export async function registerOwner(code: string) {
  const { data, error } =
    await supabase.functions.invoke<RegisterOwnerResponse>(
      'register-owner',
      {
        body: { code: code.trim() },
      },
    )

  if (error) {
    let message = 'No fue posible activar la cuenta.'
    const context = (error as { context?: Response }).context

    if (context) {
      try {
        const body = await context.clone().json()
        if (typeof body?.message === 'string') {
          message = body.message
        }
      } catch {
        // Mantener mensaje genérico.
      }
    }

    throw new Error(message)
  }

  if (!data) {
    throw new Error('Supabase no devolvió una respuesta.')
  }

  return data
}
