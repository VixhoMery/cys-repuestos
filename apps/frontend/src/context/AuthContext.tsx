import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type {
  Session,
  User,
} from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

export type UserRole =
  | 'admin'
  | 'vendedor'
  | 'bodega'

export type AccountType =
  | 'pending'
  | 'owner'
  | 'developer'

export type Profile = {
  id: string
  full_name: string
  role: UserRole
  active: boolean
  account_type: AccountType
  created_at: string
  updated_at: string
}

type AuthResult = {
  error: string | null
}

type RegisterResult = AuthResult & {
  needsEmailConfirmation: boolean
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isAuthorized: boolean
  isPending: boolean
  loading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<AuthResult>
  registerAccount: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<RegisterResult>
  loginWithGoogle: () => Promise<AuthResult>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, role, active, account_type, created_at, updated_at',
      )
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error)
      setProfile(null)
      return
    }

    setProfile(data as Profile)
  }

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    await loadProfile(user.id)
  }

  useEffect(() => {
    const loadInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        setSession(initialSession)

        const currentUser =
          initialSession?.user ?? null

        setUser(currentUser)

        if (currentUser) {
          await loadProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('Error cargando sesión:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    void loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)

        const currentUser =
          newSession?.user ?? null

        setUser(currentUser)

        if (currentUser) {
          void loadProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (
    email: string,
    password: string,
  ) => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    return {
      error:
        error
          ? error.message
          : null,
    }
  }

  const registerAccount = async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<RegisterResult> => {
    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name:
              fullName.trim(),
          },
          emailRedirectTo:
            `${window.location.origin}/`,
        },
      })

    if (error) {
      return {
        error:
          error.message,
        needsEmailConfirmation:
          false,
      }
    }

    return {
      error: null,
      needsEmailConfirmation:
        !data.session,
    }
  }

  const loginWithGoogle =
    async (): Promise<AuthResult> => {
      const {
        error,
      } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              `${window.location.origin}/`,
          },
        })

      return {
        error:
          error
            ? error.message
            : null,
      }
    }

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        'Error cerrando sesión:',
        error,
      )
      return
    }

    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const isAuthenticated =
    !!user

  const isAuthorized =
    !!user &&
    !!profile &&
    profile.active === true &&
    (
      profile.account_type ===
        'owner' ||
      profile.account_type ===
        'developer'
    )

  const isPending =
    !!user &&
    profile?.account_type ===
      'pending'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated,
        isAuthorized,
        isPending,
        loading,
        login,
        registerAccount,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider',
    )
  }

  return context
}
