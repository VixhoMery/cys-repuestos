import {
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  UserPlus,
} from 'lucide-react'

import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'

function Register() {
  const navigate =
    useNavigate()

  const {
    registerAccount,
    loginWithGoogle,
  } =
    useAuth()

  const [
    fullName,
    setFullName,
  ] =
    useState('')
  const [email, setEmail] =
    useState('')
  const [password, setPassword] =
    useState('')
  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('')
  const [error, setError] =
    useState('')
  const [message, setMessage] =
    useState('')
  const [loading, setLoading] =
    useState(false)
  const [
    googleLoading,
    setGoogleLoading,
  ] =
    useState(false)

  const handleSubmit =
    async (
      event:
        React.FormEvent,
    ) => {
      event.preventDefault()

      setError('')
      setMessage('')

      if (
        fullName.trim()
          .length < 2
      ) {
        setError(
          'Ingresa tu nombre.',
        )
        return
      }

      if (
        password.length <
        8
      ) {
        setError(
          'La contraseña debe tener al menos 8 caracteres.',
        )
        return
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          'Las contraseñas no coinciden.',
        )
        return
      }

      setLoading(true)

      const result =
        await registerAccount(
          fullName,
          email,
          password,
        )

      setLoading(false)

      if (result.error) {
        setError(
          'No fue posible crear la cuenta. Revisa los datos e inténtalo nuevamente.',
        )
        return
      }

      if (
        result.needsEmailConfirmation
      ) {
        setMessage(
          'Cuenta creada. Revisa tu correo y confirma tu dirección para continuar.',
        )
        return
      }

      navigate('/', {
        replace: true,
      })
    }

  const handleGoogle =
    async () => {
      setError('')
      setMessage('')
      setGoogleLoading(
        true,
      )

      const result =
        await loginWithGoogle()

      if (result.error) {
        setError(
          'No fue posible continuar con Google.',
        )
        setGoogleLoading(
          false,
        )
      }
    }

  const busy =
    loading ||
    googleLoading

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

          <h1 className="text-2xl font-bold text-slate-900">
            Crear cuenta
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Después del registro deberás activar tu acceso con el código privado de C&S.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="register-full-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nombre
            </label>

            <input
              id="register-full-name"
              type="text"
              value={fullName}
              onChange={(
                event,
              ) =>
                setFullName(
                  event.target
                    .value,
                )
              }
              required
              autoComplete="name"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target
                    .value,
                )
              }
              required
              autoComplete="email"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target
                    .value,
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Repetir contraseña
            </label>

            <input
              id="register-confirm-password"
              type="password"
              value={
                confirmPassword
              }
              onChange={(
                event,
              ) =>
                setConfirmPassword(
                  event.target
                    .value,
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="
                w-full rounded-lg
                border border-slate-300
                px-4 py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="
              flex w-full items-center
              justify-center gap-2
              rounded-xl
              bg-blue-600
              px-5 py-3
              font-medium text-white
              transition
              hover:bg-blue-700
              disabled:opacity-50
            "
          >
            <UserPlus
              size={18}
            />

            {loading
              ? 'Creando cuenta...'
              : 'Crear cuenta'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              o
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={
              handleGoogle
            }
            disabled={busy}
            className="
              flex w-full items-center
              justify-center gap-3
              rounded-xl
              border border-slate-300
              bg-white
              px-5 py-3
              font-medium text-slate-700
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            <span
              className="
                flex h-6 w-6
                items-center justify-center
                rounded-full
                border border-slate-200
                text-sm font-bold
                text-slate-700
              "
              aria-hidden="true"
            >
              G
            </span>

            {googleLoading
              ? 'Conectando...'
              : 'Continuar con Google'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Register
