import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  LoaderCircle,
  Pencil,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  getManagedUsers,
  inviteStaffUser,
  setReportRecipient,
  updateStaffUser,
  type ManagedUser,
  type StaffRole,
} from "../api/users";

type DialogMode =
  | "invite"
  | "edit"
  | null;

type UserFormState = {
  fullName: string;
  email: string;
  role: StaffRole;
  active: boolean;
  receivesMonthlyReport: boolean;
};

const EMPTY_FORM: UserFormState = {
  fullName: "",
  email: "",
  role: "vendedor",
  active: true,
  receivesMonthlyReport: false,
};

function getRoleLabel(
  user: ManagedUser,
) {
  if (
    user.accountType ===
    "owner"
  ) {
    return "Owner";
  }

  if (
    user.accountType ===
    "developer"
  ) {
    return "Developer";
  }

  if (
    user.accountType ===
    "pending"
  ) {
    return "Pendiente";
  }

  switch (user.role) {
    case "admin":
      return "Administrador";

    case "vendedor":
      return "Vendedor";

    case "bodega":
      return "Bodega";

    default:
      return user.role;
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

function Users() {
  const [users, setUsers] =
    useState<ManagedUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [
    dialogMode,
    setDialogMode,
  ] =
    useState<DialogMode>(
      null,
    );

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<ManagedUser | null>(
      null,
    );

  const [form, setForm] =
    useState<UserFormState>(
      EMPTY_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [
    dialogError,
    setDialogError,
  ] =
    useState("");

  const [busyUserId, setBusyUserId] =
    useState<string | null>(
      null,
    );

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getManagedUsers();

        setUsers(data);
      } catch (error) {
        console.error(
          "Error cargando usuarios:",
          error,
        );

        setError(
          getErrorMessage(
            error,
            "No fue posible cargar los usuarios.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openInviteDialog =
    () => {
      setSelectedUser(null);

      setForm({
        ...EMPTY_FORM,
      });

      setDialogError("");
      setDialogMode("invite");
    };

  const openEditDialog = (
    user: ManagedUser,
  ) => {
    if (
      user.accountType !==
      "staff"
    ) {
      return;
    }

    setSelectedUser(user);

    setForm({
      fullName:
        user.fullName,
      email:
        user.email ?? "",
      role:
        user.role,
      active:
        user.active,
      receivesMonthlyReport:
        user.receivesMonthlyReport,
    });

    setDialogError("");
    setDialogMode("edit");
  };

  const closeDialog =
    () => {
      if (saving) {
        return;
      }

      setDialogMode(null);
      setSelectedUser(null);
      setDialogError("");
    };

  const handleRoleChange = (
    role: StaffRole,
  ) => {
    setForm(
      (current) => ({
        ...current,
        role,
        receivesMonthlyReport:
          role === "admin"
            ? current.receivesMonthlyReport
            : false,
      }),
    );
  };

  const handleSubmit =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault();

      try {
        setSaving(true);
        setDialogError("");
        setNotice("");

        if (
          dialogMode ===
          "invite"
        ) {
          await inviteStaffUser({
            fullName:
              form.fullName,
            email:
              form.email,
            role:
              form.role,
            receivesMonthlyReport:
              form.receivesMonthlyReport,
          });

          setNotice(
            "Invitación enviada correctamente.",
          );
        } else if (
          dialogMode ===
            "edit" &&
          selectedUser
        ) {
          await updateStaffUser({
            userId:
              selectedUser.id,
            fullName:
              form.fullName,
            role:
              form.role,
            active:
              form.active,
            receivesMonthlyReport:
              form.receivesMonthlyReport,
          });

          setNotice(
            "Usuario actualizado correctamente.",
          );
        }

        await loadUsers();

        setDialogMode(null);
        setSelectedUser(null);
      } catch (error) {
        console.error(
          "Error guardando usuario:",
          error,
        );

        setDialogError(
          getErrorMessage(
            error,
            "No fue posible guardar los cambios.",
          ),
        );
      } finally {
        setSaving(false);
      }
    };

  const handleToggleActive =
    async (
      user: ManagedUser,
    ) => {
      if (
        user.accountType !==
        "staff"
      ) {
        return;
      }

      try {
        setBusyUserId(
          user.id,
        );

        setError("");
        setNotice("");

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
        });

        setNotice(
          user.active
            ? "Usuario desactivado correctamente."
            : "Usuario activado correctamente.",
        );

        await loadUsers();
      } catch (error) {
        console.error(
          "Error cambiando estado:",
          error,
        );

        setError(
          getErrorMessage(
            error,
            "No fue posible cambiar el estado del usuario.",
          ),
        );
      } finally {
        setBusyUserId(
          null,
        );
      }
    };

  const handleToggleReport =
    async (
      user: ManagedUser,
    ) => {
      const canReceiveReport =
        user.accountType ===
          "owner" ||
        (
          user.accountType ===
            "staff" &&
          user.role ===
            "admin"
        );

      if (
        !canReceiveReport
      ) {
        return;
      }

      try {
        setBusyUserId(
          user.id,
        );

        setError("");
        setNotice("");

        await setReportRecipient(
          user.id,
          !user.receivesMonthlyReport,
        );

        setNotice(
          user.receivesMonthlyReport
            ? "Usuario eliminado de los destinatarios del reporte."
            : "Usuario agregado a los destinatarios del reporte.",
        );

        await loadUsers();
      } catch (error) {
        console.error(
          "Error actualizando reporte:",
          error,
        );

        setError(
          getErrorMessage(
            error,
            "No fue posible actualizar el destinatario del reporte.",
          ),
        );
      } finally {
        setBusyUserId(
          null,
        );
      }
    };

  return (
    <section>
      {/* Encabezado */}
      <header
        className="
          mb-8
          flex flex-col
          justify-between
          gap-4
          sm:flex-row
          sm:items-end
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
          <Plus size={19} />

          Agregar usuario
        </button>
      </header>

      {/* Mensaje de éxito */}
      {notice && (
        <div
          className="
            mb-5
            rounded-xl
            border
            border-emerald-200
            bg-emerald-50
            px-4 py-3
            text-sm
            text-emerald-700
          "
        >
          {notice}
        </div>
      )}

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

            <p className="mt-3 text-sm text-slate-500">
              Cargando usuarios...
            </p>
          </div>
        </div>
      )}

      {!loading &&
        error && (
          <div
            className="
              mb-5
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-6
              text-red-700
            "
          >
            {error}
          </div>
        )}

      {!loading && (
        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
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

                  <th className="px-6 py-4 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (user) => {
                    const isStaff =
                      user.accountType ===
                      "staff";

                    const canReceiveReport =
                      user.accountType ===
                        "owner" ||
                      (
                        user.accountType ===
                          "staff" &&
                        user.role ===
                          "admin"
                      );

                    const busy =
                      busyUserId ===
                      user.id;

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="
                          border-b
                          border-slate-100
                          last:border-b-0
                        "
                      >
                        {/* Usuario */}
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
                                size={
                                  19
                                }
                              />
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {
                                  user.fullName
                                }
                              </p>

                              <p className="mt-0.5 text-sm text-slate-500">
                                {user.email ??
                                  "Sin correo"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {(user.accountType ===
                              "owner" ||
                              user.accountType ===
                                "developer") && (
                              <ShieldCheck
                                size={
                                  17
                                }
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

                        {/* Estado */}
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
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            {user.active
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>

                        {/* Reporte */}
                        <td className="px-6 py-5">
                          {canReceiveReport ? (
                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                void handleToggleReport(
                                  user,
                                )
                              }
                              className={`
                                rounded-full
                                px-3 py-1
                                text-xs
                                font-medium
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-50

                                ${
                                  user.receivesMonthlyReport
                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }
                              `}
                            >
                              {user.receivesMonthlyReport
                                ? "Recibe"
                                : "No recibe"}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">
                              No disponible
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {isStaff ? (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    openEditDialog(
                                      user,
                                    )
                                  }
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    border
                                    border-slate-200
                                    px-3 py-2
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    transition
                                    hover:bg-slate-50
                                    disabled:cursor-not-allowed
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
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    void handleToggleActive(
                                      user,
                                    )
                                  }
                                  className={`
                                    rounded-lg
                                    px-3 py-2
                                    text-sm
                                    font-medium
                                    transition
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50

                                    ${
                                      user.active
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    }
                                  `}
                                >
                                  {busy
                                    ? "Guardando..."
                                    : user.active
                                      ? "Desactivar"
                                      : "Activar"}
                                </button>
                              </>
                            ) : (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  text-xs
                                  text-slate-400
                                "
                              >
                                <ShieldCheck
                                  size={
                                    14
                                  }
                                />

                                Cuenta protegida
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}

                {users.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        5
                      }
                      className="
                        px-6 py-14
                        text-center
                        text-slate-500
                      "
                    >
                      No hay
                      usuarios
                      registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && (
        <div
          className="
            mt-5
            flex items-center
            gap-2
            text-sm
            text-slate-500
          "
        >
          <UsersRound
            size={17}
          />

          {users.length}{" "}
          {users.length === 1
            ? "cuenta registrada"
            : "cuentas registradas"}
        </div>
      )}

      {/* Modal */}
      {dialogMode && (
        <div
          className="
            fixed inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/40
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-2xl
              bg-white
              p-6
              shadow-xl
            "
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {dialogMode ===
                "invite"
                  ? "Agregar usuario"
                  : "Editar usuario"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dialogMode ===
                "invite"
                  ? "Se enviará una invitación al correo indicado."
                  : "Modifica el rol y acceso de esta cuenta."}
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              {/* Nombre */}
              <div>
                <label
                  htmlFor="user-full-name"
                  className="
                    mb-1.5
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Nombre
                </label>

                <input
                  id="user-full-name"
                  type="text"
                  required
                  minLength={
                    2
                  }
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
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              {/* Correo */}
              <div>
                <label
                  htmlFor="user-email"
                  className="
                    mb-1.5
                    block
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
                    "invite"
                  }
                  disabled={
                    dialogMode ===
                    "edit"
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
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4 py-3
                    outline-none
                    transition
                    disabled:bg-slate-50
                    disabled:text-slate-500
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              {/* Rol */}
              <div>
                <label
                  htmlFor="user-role"
                  className="
                    mb-1.5
                    block
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
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4 py-3
                    outline-none
                    transition
                    focus:border-blue-500
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

                <p className="mt-2 text-xs text-slate-500">
                  Administrador:
                  operación general.
                  Vendedor:
                  productos y ventas.
                  Bodega:
                  productos e
                  inventario.
                </p>
              </div>

              {/* Estado */}
              {dialogMode ===
                "edit" && (
                <label
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-slate-200
                    p-4
                  "
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Usuario
                      activo
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Puede
                      acceder al
                      sistema.
                    </p>
                  </div>

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
                    className="
                      h-5 w-5
                      rounded
                      border-slate-300
                      text-blue-600
                    "
                  />
                </label>
              )}

              {/* Reporte */}
              <label
                className={`
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-200
                  p-4

                  ${
                    form.role !==
                    "admin"
                      ? "opacity-50"
                      : ""
                  }
                `}
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Reporte
                    mensual
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Solo disponible
                    para
                    administradores.
                  </p>
                </div>

                <input
                  type="checkbox"
                  disabled={
                    form.role !==
                    "admin"
                  }
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
                  className="
                    h-5 w-5
                    rounded
                    border-slate-300
                    text-blue-600
                  "
                />
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
                  {dialogError}
                </div>
              )}

              {/* Botones */}
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
                  disabled={
                    saving
                  }
                  onClick={
                    closeDialog
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-5 py-2.5
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
                    min-w-28
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5 py-2.5
                    font-medium
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving && (
                    <LoaderCircle
                      size={
                        17
                      }
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Guardando..."
                    : dialogMode ===
                        "invite"
                      ? "Enviar invitación"
                      : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Users;