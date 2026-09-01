import {
  supabase,
} from '../lib/supabase'

export type StaffRole =
  | 'admin'
  | 'vendedor'
  | 'bodega'

export type AccountType =
  | 'pending'
  | 'owner'
  | 'staff'
  | 'developer'

export type ManagedUser = {
  id: string
  fullName: string
  email: string | null
  role: StaffRole
  active: boolean
  accountType: AccountType
  receivesMonthlyReport: boolean
  createdAt: string
  manageable: boolean
}

type ManageUsersResponse = {
  message?: string
  users?: ManagedUser[]
  user?: ManagedUser
  deletedUserId?: string
}

async function invokeManageUsers(
  body:
    Record<
      string,
      unknown
    >,
) {
  const {
    data,
    error,
  } =
    await supabase.functions
      .invoke(
        'manage-users',
        {
          body,
        },
      )

  if (error) {
    console.error(
      'Error invocando manage-users:',
      error,
    )

    throw new Error(
      error.message ||
        'No fue posible administrar los usuarios.',
    )
  }

  const result =
    data as
      | ManageUsersResponse
      | null

  if (!result) {
    throw new Error(
      'La administración de usuarios no devolvió una respuesta.',
    )
  }

  return result
}

export async function getManagedUsers() {
  const result =
    await invokeManageUsers({
      action:
        'list',
    })

  return (
    result.users ??
    []
  )
}

export async function inviteStaffUser(
  input: {
    fullName: string
    email: string
    role: StaffRole
    receivesMonthlyReport: boolean
  },
) {
  const result =
    await invokeManageUsers({
      action:
        'invite',

      fullName:
        input.fullName,

      email:
        input.email,

      role:
        input.role,

      receivesMonthlyReport:
        input.receivesMonthlyReport,
    })

  if (!result.user) {
    throw new Error(
      result.message ||
        'No fue posible crear el usuario.',
    )
  }

  return result.user
}

export async function updateStaffUser(
  input: {
    userId: string
    fullName: string
    role: StaffRole
    active: boolean
    receivesMonthlyReport: boolean
  },
) {
  const result =
    await invokeManageUsers({
      action:
        'update',

      userId:
        input.userId,

      fullName:
        input.fullName,

      role:
        input.role,

      active:
        input.active,

      receivesMonthlyReport:
        input.receivesMonthlyReport,
    })

  return (
    result.message ??
    'Usuario actualizado correctamente.'
  )
}

export async function setReportRecipient(
  userId: string,
  enabled: boolean,
) {
  const result =
    await invokeManageUsers({
      action:
        'set-report-recipient',

      userId,
      enabled,
    })

  return (
    result.message ??
    'Destinatario actualizado correctamente.'
  )
}

export async function deleteManagedUser(
  userId: string,
) {
  const result =
    await invokeManageUsers({
      action:
        'delete',

      userId,
    })

  if (
    result.deletedUserId &&
    result.deletedUserId !==
      userId
  ) {
    throw new Error(
      'La respuesta de eliminación no corresponde al usuario solicitado.',
    )
  }

  return (
    result.message ??
    'Usuario eliminado correctamente.'
  )
}