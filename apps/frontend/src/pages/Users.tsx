import {
  useEffect,
  useState,
} from 'react'

import {
  LoaderCircle,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'

import {
  getManagedUsers,
  type ManagedUser,
} from '../api/users'

function getRoleLabel(
  user: ManagedUser,
) {
  if (
    user.accountType === 'owner'
  ) {
    return 'Owner'
  }

  if (
    user.accountType ===
    'developer'
  ) {
    return 'Developer'
  }

  if (
    user.accountType ===
    'pending'
  ) {
    return 'Pendiente'
  }

  switch (user.role) {
    case 'admin':
      return 'Administrador'

    case 'vendedor':
      return 'Vendedor'

    case 'bodega':
      return 'Bodega'

    default:
      return user.role
  }
}

function Users() {
  const [users, setUsers] =
    useState<ManagedUser[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await getManagedUsers()

        setUsers(data)
      } catch (error) {
        console.error(
          'Error cargando usuarios:',
          error,
        )

        setError(
          'No fue posible cargar los usuarios.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadUsers()
  }, [])

  return (
    <section>
      <header
        className="
          mb-8 flex flex-col
          justify-between gap-4
          sm:flex-row sm:items-end
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Usuarios
          </h1>

          <p className="mt-1 text-slate-500">
            Administra las cuentas con
            acceso al sistema.
          </p>
        </div>
      </header>

      {loading && (
        <div
          className="
            flex min-h-72
            items-center justify-center
            rounded-2xl
            border border-slate-200
            bg-white
          "
        >
          <div className="text-center">
            <LoaderCircle
              size={30}
              className="
                mx-auto animate-spin
                text-blue-600
              "
            />

            <p className="mt-3 text-sm text-slate-500">
              Cargando usuarios...
            </p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          className="
            rounded-2xl
            border border-red-200
            bg-red-50 p-6
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {!loading &&
        !error && (
          <div
            className="
              overflow-hidden
              rounded-2xl
              border border-slate-200
              bg-white shadow-sm
            "
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr
                    className="
                      border-b
                      border-slate-200
                      text-left
                      text-sm
                      text-slate-500
                    "
                  >
                    <th className="px-6 py-4 font-medium">
                      Usuario
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Rol
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Estado
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Reporte mensual
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="
                          border-b
                          border-slate-100
                          last:border-b-0
                        "
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-blue-50
                                text-blue-600
                              "
                            >
                              <UserRound
                                size={19}
                              />
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {
                                  user.fullName
                                }
                              </p>

                              <p className="mt-0.5 text-sm text-slate-500">
                                {
                                  user.email ??
                                  'Sin correo'
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {(user.accountType ===
                              'owner' ||
                              user.accountType ===
                                'developer') && (
                              <ShieldCheck
                                size={17}
                                className="text-blue-500"
                              />
                            )}

                            <span className="text-slate-700">
                              {getRoleLabel(
                                user,
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-3 py-1
                              text-xs
                              font-medium
                              ${
                                user.active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }
                            `}
                          >
                            {user.active
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-slate-600">
                            {user.receivesMonthlyReport
                              ? 'Sí'
                              : 'No'}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}

                  {users.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="
                          px-6 py-14
                          text-center
                          text-slate-500
                        "
                      >
                        No hay usuarios
                        registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {!loading &&
        !error && (
          <div
            className="
              mt-5 flex
              items-center gap-2
              text-sm
              text-slate-500
            "
          >
            <UsersRound size={17} />

            {users.length}{' '}
            {users.length === 1
              ? 'cuenta registrada'
              : 'cuentas registradas'}
          </div>
        )}
    </section>
  )
}

export default Users