import { supabase } from '../lib/supabase'

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
}

async function invokeManageUsers(
  body: Record<string, unknown>,
) {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
    'manage-users',
    {
      body,
    },
  )

  if (error) {
    console.error(
      'Error manage-users:',
      error,
    )

    throw new Error(
      error.message ||
        'No fue posible administrar los usuarios.',
    )
  }

  const result =
    data as ManageUsersResponse | null

  if (!result) {
    throw new Error(
      'Supabase no devolvió una respuesta válida.',
    )
  }

  return result
}

export async function getManagedUsers() {
  const result =
    await invokeManageUsers({
      action: 'list',
    })

  return result.users ?? []
}

export async function inviteStaffUser(
  input: {
    fullName: string
    email: string
    role: StaffRole
    receivesMonthlyReport: boolean
  },
) {
  return invokeManageUsers({
    action: 'invite',
    ...input,
  })
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
  return invokeManageUsers({
    action: 'update',
    ...input,
  })
}

export async function setReportRecipient(
  userId: string,
  enabled: boolean,
) {
  return invokeManageUsers({
    action:
      'set-report-recipient',
    userId,
    enabled,
  })
}