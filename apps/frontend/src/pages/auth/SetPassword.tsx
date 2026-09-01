import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import logo from '../../assets/logo.png'

import {
  supabase,
} from '../../lib/supabase'

function SetPassword() {
  const navigate =
    useNavigate()

  const [
    password,
    setPassword,
  ] =
    useState('')

  const [
    confirmation,
    setConfirmation,
  ] =
    useState('')

  const [
    checking,
    setChecking,
  ] =
    useState(true)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  useEffect(() => {
    const checkSession =
      async () => {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth
            .getSession()

        if (!session) {
          setError(
            'La invitación no es válida o ya expiró.',
          )
        }

        setChecking(false)
      }

    void checkSession()
  }, [])

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setError('')

      if (
        password.length < 8
      ) {
        setError(
          'La contraseña debe tener al menos 8 caracteres.',
        )

        return
      }

      if (
        password !==
        confirmation
      ) {
        setError(
          'Las contraseñas no coinciden.',
        )

        return
      }

      try {
        setSaving(true)

        const {
          error:
            updateError,
        } =
          await supabase.auth
            .updateUser({
              password,
            })

        if (updateError) {
          throw updateError
        }

        navigate(
          '/productos',
          {
            replace: true,
          },
        )
      } catch (error) {
        console.error(
          'Error estableciendo contraseña:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible guardar la contraseña.',
        )
      } finally {
        setSaving(false)
      }
    }

  if (checking) {
    return (
      <main
        className="
          flex min-h-screen
          items-center
          justify-center
          bg-slate-100
          p-6
        "
      >
        <LoaderCircle
          size={32}
          className="
            animate-spin
            text-blue-600
          "
        />
      </main>
    )
  }

  return (
    <main
      className="
        flex min-h-screen
        items-center
        justify-center
        bg-slate-100
        p-6
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-3xl
          border
          border-slate-200
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
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              bg-white
              p-2
            "
          >
            <img
              src={logo}
              alt="Logo C&S Repuestos"
              className="
                h-full w-full
                object-contain
              "
            />
          </div>

          <div
            className="
              mx-auto mb-4
              flex h-12 w-12
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-blue-600
            "
          >
            <ShieldCheck
              size={24}
            />
          </div>

          <h1
            className="
              text-2xl
              font-bold
              text-slate-900
            "
          >
            Crear contraseña
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-500
            "
          >
            Completa tu acceso a C&S Repuestos creando una contraseña.
          </p>
        </div>

        {error &&
          !saving &&
          !password && (
            <div
              className="
                mb-5
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4 py-3
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="
                mb-2 block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Contraseña
            </label>

            <div className="relative">
              <KeyRound
                size={18}
                className="
                  absolute
                  left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="password"
                type="password"
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
                }
                minLength={8}
                required
                autoComplete="new-password"
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
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

          <div>
            <label
              htmlFor="confirmation"
              className="
                mb-2 block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Repetir contraseña
            </label>

            <div className="relative">
              <KeyRound
                size={18}
                className="
                  absolute
                  left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="confirmation"
                type="password"
                value={
                  confirmation
                }
                onChange={(
                  event,
                ) =>
                  setConfirmation(
                    event.target.value,
                  )
                }
                minLength={8}
                required
                autoComplete="new-password"
                className="
                  w-full
                  rounded-lg
                  border
                  border-slate-300
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

          {error &&
            password && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

          <button
            type="submit"
            disabled={
              saving
            }
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
            {saving ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck
                size={18}
              />
            )}

            {saving
              ? 'Guardando...'
              : 'Crear contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default SetPassword