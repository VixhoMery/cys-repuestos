import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  AlertTriangle,
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

import {
  deleteManagedUser,
  getManagedUsers,
  inviteStaffUser,
  setReportRecipient,
  updateStaffUser,
  type ManagedUser,
  type StaffRole,
} from '../api/users'

type DialogMode =
  | 'invite'
  | 'edit'
  | null

type UserFormState = {
  fullName: string
  email: string
  role: StaffRole
  active: boolean
  receivesMonthlyReport: boolean
}

const EMPTY_FORM: UserFormState = {
  fullName: '',
  email: '',
  role: 'vendedor',
  active: true,
  receivesMonthlyReport: false,
}

const ROLE_LABELS: Record<
  string,
  string
> = {
  owner: 'Owner',
  developer: 'Developer',
  pending: 'Pendiente',
  admin: 'Administrador',
  vendedor: 'Vendedor',
  bodega: 'Bodega',
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error
    ? error.message
    : fallback
}

function Users() {
  const [
    users,
    setUsers,
  ] =
    useState<
      ManagedUser[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    notice,
    setNotice,
  ] =
    useState('')

  const [
    dialogMode,
    setDialogMode,
  ] =
    useState<DialogMode>(
      null,
    )

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<
      ManagedUser | null
    >(null)

  const [
    form,
    setForm,
  ] =
    useState<UserFormState>(
      EMPTY_FORM,
    )

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    dialogError,
    setDialogError,
  ] =
    useState('')

  const [
    busyUserId,
    setBusyUserId,
  ] =
    useState<
      string | null
    >(null)

  const [
    userToDelete,
    setUserToDelete,
  ] =
    useState<
      ManagedUser | null
    >(null)

  const [
    deleting,
    setDeleting,
  ] =
    useState(false)

  const [
    deleteError,
    setDeleteError,
  ] =
    useState('')

  const loadUsers =
    useCallback(
      async () => {
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
            getErrorMessage(
              error,
              'No fue posible cargar los usuarios.',
            ),
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const clearMessages =
    () => {
      setError('')
      setNotice('')
    }

  const openInviteDialog =
    () => {
      clearMessages()

      setSelectedUser(
        null,
      )

      setForm({
        ...EMPTY_FORM,
      })

      setDialogError('')
      setDialogMode(
        'invite',
      )
    }

  const openEditDialog =
    (
      user:
        ManagedUser,
    ) => {
      if (
        user.accountType !==
        'staff'
      ) {
        return
      }

      clearMessages()

      setSelectedUser(
        user,
      )

      setForm({
        fullName:
          user.fullName,
        email:
          user.email ??
          '',
        role:
          user.role,
        active:
          user.active,
        receivesMonthlyReport:
          user.receivesMonthlyReport,
      })

      setDialogError('')
      setDialogMode(
        'edit',
      )
    }

  const closeDialog =
    () => {
      if (saving) {
        return
      }

      setDialogMode(null)
      setSelectedUser(
        null,
      )

      setForm({
        ...EMPTY_FORM,
      })

      setDialogError('')
    }

  const handleRoleChange =
    (
      role:
        StaffRole,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,
          role,
          receivesMonthlyReport:
            role ===
            'admin'
              ? current.receivesMonthlyReport
              : false,
        }),
      )
    }

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setDialogError('')

      const fullName =
        form.fullName.trim()

      const email =
        form.email
          .trim()
          .toLowerCase()

      if (
        fullName.length <
        2
      ) {
        setDialogError(
          'Ingresa un nombre válido.',
        )

        return
      }

      if (
        dialogMode ===
          'invite' &&
        (
          !email ||
          !email.includes(
            '@',
          )
        )
      ) {
        setDialogError(
          'Ingresa un correo válido.',
        )

        return
      }

      try {
        setSaving(true)

        if (
          dialogMode ===
          'invite'
        ) {
          await inviteStaffUser({
            fullName,
            email,
            role:
              form.role,
            receivesMonthlyReport:
              form.role ===
                'admin' &&
              form.receivesMonthlyReport,
          })

          setNotice(
            'Invitación enviada correctamente.',
          )
        }

        if (
          dialogMode ===
            'edit' &&
          selectedUser
        ) {
          await updateStaffUser({
            userId:
              selectedUser.id,
            fullName,
            role:
              form.role,
            active:
              form.active,
            receivesMonthlyReport:
              form.role ===
                'admin' &&
              form.receivesMonthlyReport,
          })

          setNotice(
            'Usuario actualizado correctamente.',
          )
        }

        setDialogMode(
          null,
        )

        setSelectedUser(
          null,
        )

        setForm({
          ...EMPTY_FORM,
        })

        await loadUsers()
      } catch (error) {
        console.error(
          'Error guardando usuario:',
          error,
        )

        setDialogError(
          getErrorMessage(
            error,
            'No fue posible guardar el usuario.',
          ),
        )
      } finally {
        setSaving(false)
      }
    }

  const handleToggleActive =
    async (
      user:
        ManagedUser,
    ) => {
      if (
        user.accountType !==
        'staff'
      ) {
        return
      }

      try {
        clearMessages()

        setBusyUserId(
          user.id,
        )

        await updateStaffUser({
          userId:
            user.id,
          fullName:
            user.fullName,
          role:
            user.role,
          active:
            !user.active,
          receivesMonthlyReport:
            user.receivesMonthlyReport,
        })

        setNotice(
          user.active
            ? 'Usuario desactivado correctamente.'
            : 'Usuario activado correctamente.',
        )

        await loadUsers()
      } catch (error) {
        console.error(
          'Error cambiando estado:',
          error,
        )

        setError(
          getErrorMessage(
            error,
            'No fue posible cambiar el estado del usuario.',
          ),
        )
      } finally {
        setBusyUserId(
          null,
        )
      }
    }

  const handleToggleReport =
    async (
      user:
        ManagedUser,
    ) => {
      const canReceive =
        user.accountType ===
          'owner' ||
        (
          user.accountType ===
            'staff' &&
          user.role ===
            'admin'
        )

      if (!canReceive) {
        return
      }

      try {
        clearMessages()

        setBusyUserId(
          user.id,
        )

        await setReportRecipient(
          user.id,
          !user.receivesMonthlyReport,
        )

        setNotice(
          user.receivesMonthlyReport
            ? 'Usuario removido del reporte mensual.'
            : 'Usuario agregado al reporte mensual.',
        )

        await loadUsers()
      } catch (error) {
        console.error(
          'Error cambiando destinatario:',
          error,
        )

        setError(
          getErrorMessage(
            error,
            'No fue posible cambiar el destinatario del reporte.',
          ),
        )
      } finally {
        setBusyUserId(
          null,
        )
      }
    }

  const requestDeleteUser =
    (
      user:
        ManagedUser,
    ) => {
      if (
        user.accountType !==
          'staff' &&
        user.accountType !==
          'pending'
      ) {
        return
      }

      clearMessages()

      setDeleteError('')
      setUserToDelete(
        user,
      )
    }

  const closeDeleteDialog =
    () => {
      if (deleting) {
        return
      }

      setUserToDelete(
        null,
      )

      setDeleteError('')
    }

  const confirmDeleteUser =
    async () => {
      if (
        !userToDelete
      ) {
        return
      }

      try {
        setDeleting(true)
        setDeleteError('')

        await deleteManagedUser(
          userToDelete.id,
        )

        setUserToDelete(
          null,
        )

        setNotice(
          'Usuario eliminado correctamente.',
        )

        await loadUsers()
      } catch (error) {
        console.error(
          'Error eliminando usuario:',
          error,
        )

        setDeleteError(
          getErrorMessage(
            error,
            'No fue posible eliminar el usuario.',
          ),
        )
      } finally {
        setDeleting(false)
      }
    }

  return (
    <>
      <section>
        {/* ==================================
            ENCABEZADO
        ================================== */}

        <header
          className="
            mb-8
            flex flex-col
            justify-between
            gap-4
            lg:flex-row
            lg:items-end
          "
        >
          <div>
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex h-11 w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-100
                  text-blue-600
                "
              >
                <UsersRound
                  size={23}
                />
              </div>

              <div>
                <h1
                  className="
                    text-3xl
                    font-bold
                    text-slate-900
                  "
                >
                  Usuarios
                </h1>

                <p
                  className="
                    mt-1
                    text-slate-500
                  "
                >
                  Administra las cuentas y permisos de C&S Repuestos.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openInviteDialog
            }
            className="
              inline-flex
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
            "
          >
            <Plus
              size={19}
            />

            Agregar usuario
          </button>
        </header>

        {/* ==================================
            MENSAJES
        ================================== */}

        {notice && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-green-200
              bg-green-50
              px-4 py-3
              text-sm
              text-green-700
            "
          >
            {notice}
          </div>
        )}

        {error && (
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

        {/* ==================================
            CARGANDO
        ================================== */}

        {loading && (
          <div
            className="
              flex min-h-72
              items-center
              justify-center
              rounded-2xl
              border
              border-slate-200
              bg-white
            "
          >
            <div className="text-center">
              <LoaderCircle
                size={30}
                className="
                  mx-auto
                  animate-spin
                  text-blue-600
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  text-slate-500
                "
              >
                Cargando usuarios...
              </p>
            </div>
          </div>
        )}

        {/* ==================================
            TABLA
        ================================== */}

        {!loading && (
          <div
            className="
              overflow-x-auto
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-sm
            "
          >
            <table className="w-full">
              <thead
                className="
                  border-b
                  border-slate-200
                  bg-slate-50
                "
              >
                <tr>
                  <th
                    className="
                      px-5 py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Usuario
                  </th>

                  <th
                    className="
                      px-5 py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Rol
                  </th>

                  <th
                    className="
                      px-5 py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Estado
                  </th>

                  <th
                    className="
                      px-5 py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Reporte mensual
                  </th>

                  <th
                    className="
                      px-5 py-4
                      text-right
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {users.map(
                  (
                    user,
                  ) => {
                    const isBusy =
                      busyUserId ===
                      user.id

                    const isStaff =
                      user.accountType ===
                      'staff'

                    const isPending =
                      user.accountType ===
                      'pending'

                    const canDelete =
                      isStaff ||
                      isPending

                    const canReceiveReport =
                      user.accountType ===
                        'owner' ||
                      (
                        isStaff &&
                        user.role ===
                          'admin'
                      )

                    const roleLabel =
                      user.accountType ===
                        'staff'
                        ? ROLE_LABELS[
                            user.role
                          ]
                        : ROLE_LABELS[
                            user.accountType
                          ]

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="
                          transition
                          hover:bg-slate-50/70
                        "
                      >
                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-100
                                text-slate-500
                              "
                            >
                              <UserRound
                                size={
                                  19
                                }
                              />
                            </div>

                            <div
                              className="
                                min-w-0
                              "
                            >
                              <p
                                className="
                                  font-medium
                                  text-slate-900
                                "
                              >
                                {user.fullName ||
                                  'Sin nombre'}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-sm
                                  text-slate-500
                                "
                              >
                                {user.email ||
                                  'Sin correo disponible'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <span
                            className="
                              inline-flex
                              rounded-full
                              bg-slate-100
                              px-3 py-1
                              text-xs
                              font-medium
                              text-slate-700
                            "
                          >
                            {roleLabel}
                          </span>
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-3 py-1
                              text-xs
                              font-medium

                              ${
                                user.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }
                            `}
                          >
                            {user.active
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          {canReceiveReport ? (
                            <button
                              type="button"
                              disabled={
                                isBusy
                              }
                              onClick={() =>
                                void handleToggleReport(
                                  user,
                                )
                              }
                              className={`
                                inline-flex
                                min-w-24
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                px-3 py-2
                                text-sm
                                font-medium
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-50

                                ${
                                  user.receivesMonthlyReport
                                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }
                              `}
                            >
                              {isBusy ? (
                                <LoaderCircle
                                  size={
                                    16
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <ShieldCheck
                                  size={
                                    16
                                  }
                                />
                              )}

                              {user.receivesMonthlyReport
                                ? 'Recibe'
                                : 'No recibe'}
                            </button>
                          ) : (
                            <span
                              className="
                                text-sm
                                text-slate-400
                              "
                            >
                              No disponible
                            </span>
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          {isStaff ||
                          isPending ? (
                            <div
                              className="
                                flex
                                flex-wrap
                                justify-end
                                gap-2
                              "
                            >
                              {isStaff && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditDialog(
                                        user,
                                      )
                                    }
                                    disabled={
                                      isBusy
                                    }
                                    className="
                                      inline-flex
                                      items-center
                                      gap-1.5
                                      rounded-lg
                                      border
                                      border-slate-200
                                      bg-white
                                      px-3 py-2
                                      text-sm
                                      font-medium
                                      text-slate-700
                                      transition
                                      hover:bg-slate-50
                                      disabled:opacity-50
                                    "
                                  >
                                    <Pencil
                                      size={
                                        15
                                      }
                                    />

                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleToggleActive(
                                        user,
                                      )
                                    }
                                    disabled={
                                      isBusy
                                    }
                                    className="
                                      rounded-lg
                                      border
                                      border-slate-200
                                      bg-white
                                      px-3 py-2
                                      text-sm
                                      font-medium
                                      text-slate-700
                                      transition
                                      hover:bg-slate-50
                                      disabled:opacity-50
                                    "
                                  >
                                    {isBusy
                                      ? 'Guardando...'
                                      : user.active
                                        ? 'Desactivar'
                                        : 'Activar'}
                                  </button>
                                </>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    requestDeleteUser(
                                      user,
                                    )
                                  }
                                  disabled={
                                    isBusy
                                  }
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    border
                                    border-red-200
                                    bg-white
                                    px-3 py-2
                                    text-sm
                                    font-medium
                                    text-red-600
                                    transition
                                    hover:bg-red-50
                                    disabled:opacity-50
                                  "
                                >
                                  <Trash2
                                    size={
                                      15
                                    }
                                  />

                                  Eliminar
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              className="
                                flex
                                justify-end
                              "
                            >
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  bg-slate-100
                                  px-3 py-2
                                  text-sm
                                  font-medium
                                  text-slate-500
                                "
                              >
                                <ShieldCheck
                                  size={
                                    15
                                  }
                                />

                                Cuenta protegida
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  },
                )}

                {users.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="
                        px-5 py-12
                        text-center
                        text-sm
                        text-slate-500
                      "
                    >
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ==================================
          MODAL CREAR / EDITAR
      ================================== */}

      {dialogMode && (
        <div
          className="
            fixed inset-0 z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-xl
              rounded-2xl
              bg-white
              p-7
              shadow-xl
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <h2
                  className="
                    text-2xl
                    font-semibold
                    text-slate-900
                  "
                >
                  {dialogMode ===
                  'invite'
                    ? 'Agregar usuario'
                    : 'Editar usuario'}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  {dialogMode ===
                  'invite'
                    ? 'Se enviará una invitación al correo indicado.'
                    : 'Actualiza los permisos y estado de la cuenta.'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeDialog
                }
                disabled={
                  saving
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                  disabled:opacity-50
                "
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="
                mt-7
                space-y-5
              "
            >
              <div>
                <label
                  htmlFor="user-name"
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Nombre
                </label>

                <input
                  id="user-name"
                  type="text"
                  required
                  maxLength={
                    100
                  }
                  value={
                    form.fullName
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        fullName:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  disabled={
                    saving
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-slate-50
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Correo
                </label>

                <input
                  id="user-email"
                  type="email"
                  required={
                    dialogMode ===
                    'invite'
                  }
                  value={
                    form.email
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        email:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  disabled={
                    saving ||
                    dialogMode ===
                      'edit'
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                    disabled:bg-slate-50
                    disabled:text-slate-500
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="user-role"
                  className="
                    mb-2 block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Rol
                </label>

                <select
                  id="user-role"
                  value={
                    form.role
                  }
                  onChange={(
                    event,
                  ) =>
                    handleRoleChange(
                      event
                        .target
                        .value as StaffRole,
                    )
                  }
                  disabled={
                    saving
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >
                  <option value="admin">
                    Administrador
                  </option>

                  <option value="vendedor">
                    Vendedor
                  </option>

                  <option value="bodega">
                    Bodega
                  </option>
                </select>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Administrador: operación general. Vendedor: productos y ventas. Bodega: productos e inventario.
                </p>
              </div>

              {dialogMode ===
                'edit' && (
                <label
                  className="
                    flex
                    cursor-pointer
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    p-4
                  "
                >
                  <input
                    type="checkbox"
                    checked={
                      form.active
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          active:
                            event
                              .target
                              .checked,
                        }),
                      )
                    }
                    disabled={
                      saving
                    }
                    className="
                      mt-1
                      h-4 w-4
                    "
                  />

                  <div>
                    <p
                      className="
                        font-medium
                        text-slate-700
                      "
                    >
                      Cuenta activa
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                      "
                    >
                      Al desactivarla, el usuario pierde acceso al sistema.
                    </p>
                  </div>
                </label>
              )}

              <label
                className={`
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  p-4

                  ${
                    form.role ===
                    'admin'
                      ? 'cursor-pointer border-slate-200'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={
                    form.receivesMonthlyReport
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        receivesMonthlyReport:
                          event
                            .target
                            .checked,
                      }),
                    )
                  }
                  disabled={
                    saving ||
                    form.role !==
                      'admin'
                  }
                  className="
                    mt-1
                    h-4 w-4
                  "
                />

                <div>
                  <p
                    className={`
                      font-medium

                      ${
                        form.role ===
                        'admin'
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }
                    `}
                  >
                    Reporte mensual
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >
                    Solo disponible para administradores.
                  </p>
                </div>
              </label>

              {dialogError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4 py-3
                    text-sm
                    text-red-700
                  "
                >
                  {
                    dialogError
                  }
                </div>
              )}

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  pt-2
                "
              >
                <button
                  type="button"
                  onClick={
                    closeDialog
                  }
                  disabled={
                    saving
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5 py-3
                    font-medium
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5 py-3
                    font-medium
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving && (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? 'Guardando...'
                    : dialogMode ===
                        'invite'
                      ? 'Enviar invitación'
                      : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================
          MODAL ELIMINAR USUARIO
      ================================== */}

      {userToDelete && (
        <div
          className="
            fixed inset-0 z-[60]
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-xl
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <div
                  className="
                    flex h-11 w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-red-100
                    text-red-600
                  "
                >
                  <AlertTriangle
                    size={22}
                  />
                </div>

                <div>
                  <h2
                    className="
                      text-xl
                      font-semibold
                      text-slate-900
                    "
                  >
                    ¿Eliminar usuario?
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeDeleteDialog
                }
                disabled={
                  deleting
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                  disabled:opacity-50
                "
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div
              className="
                mt-6
                rounded-xl
                border
                border-red-100
                bg-red-50
                p-4
              "
            >
              <p
                className="
                  text-sm
                  leading-6
                  text-red-700
                "
              >
                Se eliminará permanentemente la cuenta de{' '}
                <span className="font-semibold">
                  {userToDelete.fullName ||
                    userToDelete.email ||
                    'este usuario'}
                </span>
                .
              </p>
            </div>

            <div
              className="
                mt-4
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
              "
            >
              <p
                className="
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                Sus ventas históricas, montos y detalles se conservarán. El usuario perderá completamente el acceso al sistema y el mismo correo podrá ser invitado nuevamente más adelante.
              </p>
            </div>

            {deleteError && (
              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm
                  text-red-700
                "
              >
                {
                  deleteError
                }
              </div>
            )}

            <div
              className="
                mt-7
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={
                  closeDeleteDialog
                }
                disabled={
                  deleting
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4 py-2.5
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void confirmDeleteUser()
                }
                disabled={
                  deleting
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-4 py-2.5
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {deleting ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={18}
                  />
                )}

                {deleting
                  ? 'Eliminando...'
                  : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Users