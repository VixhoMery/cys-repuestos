import { useState } from 'react'

import {
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

import { useNavigate } from 'react-router'

import logo from '../../assets/logo.png'
import { registerOwner } from '../../api/registration'
import { useAuth } from '../../context/AuthContext'

function ActivateAccount() {
  const navigate = useNavigate()
  const { profile, logout, refreshProfile } = useAuth()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await registerOwner(code)
      await refreshProfile()
      navigate('/productos', { replace: true })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible activar la cuenta.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div
        className="
          w-full max-w-md
          rounded-3xl
          border border-slate-200
          bg-white
          p-8
          shadow-lg
          shadow-slate-200/50
        "
      >
        <div className="mb-8 text-center">
          <div
            className="
              mx-auto mb-5
              flex h-24 w-24
              items-center justify-center
              overflow-hidden
              rounded-2xl
              bg-white
              p-2
            "
          >
            <img
              src={logo}
              alt="Logo C&S Repuestos"
              className="h-full w-full object-contain"
            />
          </div>

          <div
            className="
              mx-auto mb-4
              flex h-12 w-12
              items-center justify-center
              rounded-full
              bg-blue-50
              text-blue-600
            "
          >
            <ShieldCheck size={24} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Activar cuenta C&S
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Tu cuenta existe, pero todavía no tiene acceso al sistema.
            Ingresa el código privado de C&S para activar tu cupo.
          </p>

          {profile?.full_name && (
            <p className="mt-3 text-sm font-medium text-slate-700">
              {profile.full_name}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Código de activación
            </label>

            <div className="relative">
              <KeyRound
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                minLength={12}
                autoComplete="off"
                className="
                  w-full
                  rounded-lg
                  border border-slate-300
                  py-3
                  pl-11 pr-4
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              flex w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              px-5 py-3
              font-medium
              text-white
              transition
              hover:bg-blue-700
              disabled:opacity-50
            "
          >
            <ShieldCheck size={18} />
            {loading ? 'Activando...' : 'Activar cuenta'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="
              flex w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border border-slate-200
              bg-white
              px-5 py-3
              font-medium
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}

export default ActivateAccount
