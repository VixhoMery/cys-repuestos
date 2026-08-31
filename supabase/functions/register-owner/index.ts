import { createClient } from 'npm:@supabase/supabase-js@2'




const allowedOrigins = new Set([
  'https://sistema.cysrepuestos.cl',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin')

  return {
    ...(origin && allowedOrigins.has(origin)
      ? { 'Access-Control-Allow-Origin': origin }
      : {}),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value)
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', bytes),
  )
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: getCorsHeaders(req),
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, {message: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const registrationCode = Deno.env.get('REGISTRATION_CODE')

  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !registrationCode) {
    console.error('Faltan variables internas de registro.')
    return jsonResponse(req, {
      message: 'El registro de usuarios no está configurado.',
    }, 500)
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse(req, {
      message: 'Debes iniciar sesión para realizar esta acción.',
    }, 401)
  }

  const userClient = createClient(
    supabaseUrl,
    publishableKey,
    {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  const { data: userData, error: userError } =
    await userClient.auth.getUser()

  if (userError || !userData.user) {
    return jsonResponse(req, {
      message: 'La sesión no es válida o ha expirado.',
    }, 401)
  }

  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  const {
    data: rateData,
    error: rateError,
  } = await adminClient.rpc(
    'cys_consume_registration_attempt',
    { p_user_id: userData.user.id },
  )

  if (rateError) {
    console.error('Error aplicando rate limit:', rateError)
    return jsonResponse(req, {
      message: 'No fue posible validar el intento de registro.',
    }, 500)
  }

  const rate = rateData as {
    allowed?: boolean
    retryAfterSeconds?: number
  } | null

  if (rate?.allowed !== true) {
    return jsonResponse(req, {
      message:
        'Demasiados intentos de registro. Intenta nuevamente más tarde.',
      retryAfterSeconds:
        rate?.retryAfterSeconds ?? 900,
    }, 429)
  }

  let body: { code?: unknown }

  try {
    body = await req.json()
  } catch {
    return jsonResponse(req, { message: 'La solicitud no es válida.' }, 400)
  }

  const code =
    typeof body.code === 'string' ? body.code.trim() : ''

  if (code.length < 12 || code.length > 200) {
    return jsonResponse(req, {
      message: 'El código de registro no es válido.',
    }, 400)
  }

  const [received, expected] = await Promise.all([
    hash(code),
    hash(registrationCode),
  ])

  if (!safeEqual(received, expected)) {
    return jsonResponse(req, {
      message: 'El código de registro no es válido.',
    }, 403)
  }

  const { data, error } = await adminClient.rpc(
    'cys_activate_owner_internal',
    { p_user_id: userData.user.id },
  )

  if (error) {
    console.error('Error activando owner:', error)
    return jsonResponse(req, {
      message: 'No fue posible activar la cuenta.',
    }, 500)
  }

  const result = data as {
    status?: string
    accountType?: string
    ownersUsed?: number
    ownersLimit?: number
    profile?: unknown
  } | null

  if (result?.status === 'profile-not-found') {
    return jsonResponse(req, {
      message: 'Tu cuenta no tiene un perfil válido.',
    }, 403)
  }

  if (result?.status === 'invalid-state') {
    return jsonResponse(req, {
      message: 'Tu cuenta no puede utilizar este registro.',
    }, 403)
  }

  if (result?.status === 'already-authorized') {
    return jsonResponse(req, {
      message: 'Esta cuenta ya está autorizada.',
      accountType: result.accountType,
    }, 409)
  }

  if (result?.status === 'registration-full') {
    return jsonResponse(req, {
      message: 'Los tres cupos de socios ya fueron utilizados.',
      ownersUsed: result.ownersUsed,
      ownersLimit: result.ownersLimit,
    }, 409)
  }

  if (result?.status !== 'activated') {
    return jsonResponse(req, {
      message: 'Supabase no devolvió un estado válido.',
    }, 500)
  }

  return jsonResponse(req, {
    message: 'Cuenta activada correctamente.',
    profile: result.profile,
    ownersUsed: result.ownersUsed,
    ownersLimit: result.ownersLimit,
  })
})
