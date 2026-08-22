import axios from 'axios'

import { supabase } from '../lib/supabase'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api',
  headers: {
    'Content-Type':
      'application/json',
  },
})


// ------------------------------------
// Enviar JWT de Supabase al backend
// ------------------------------------

api.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } =
      await supabase.auth.getSession()

    if (session?.access_token) {
      config.headers.Authorization =
        `Bearer ${session.access_token}`
    }

    return config
  },
)


export default api
