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


// ------------------------------
// Tipos del perfil
// ------------------------------

export type UserRole =
  | 'admin'
  | 'vendedor'
  | 'bodega'

export type Profile = {
  id: string
  full_name: string
  role: UserRole
  active: boolean
  created_at: string
  updated_at: string
}


// ------------------------------
// Tipo del contexto
// ------------------------------

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null

  isAuthenticated: boolean
  loading: boolean

  login: (
    email: string,
    password: string,
  ) => Promise<{
    error: string | null
  }>

  logout: () => Promise<void>
}


// ------------------------------
// Crear contexto
// ------------------------------

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  )


// ------------------------------
// Props del Provider
// ------------------------------

type AuthProviderProps = {
  children: ReactNode
}


// ------------------------------
// Provider
// ------------------------------

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [session, setSession] =
    useState<Session | null>(null)

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [loading, setLoading] =
    useState(true)


  // ------------------------------
  // Cargar perfil
  // ------------------------------

  const loadProfile = async (
    userId: string,
  ) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error(
        'Error cargando perfil:',
        error,
      )

      setProfile(null)

      return
    }

    setProfile(data as Profile)
  }


  // ------------------------------
  // Cargar sesión inicial
  // ------------------------------

  useEffect(() => {
    const loadInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setSession(session)

        const currentUser =
          session?.user ?? null

        setUser(currentUser)

        if (currentUser) {
          await loadProfile(
            currentUser.id,
          )
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error(
          'Error cargando sesión:',
          error,
        )

        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadInitialSession()


    // ------------------------------
    // Escuchar cambios de Auth
    // ------------------------------

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession)

          const currentUser =
            newSession?.user ?? null

          setUser(currentUser)

          if (currentUser) {
            loadProfile(currentUser.id)
          } else {
            setProfile(null)
          }

          setLoading(false)
        },
      )


    // ------------------------------
    // Limpiar listener
    // ------------------------------

    return () => {
      subscription.unsubscribe()
    }
  }, [])


  // ------------------------------
  // Login
  // ------------------------------

  const login = async (
    email: string,
    password: string,
  ) => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    return {
      error: error
        ? error.message
        : null,
    }
  }


  // ------------------------------
  // Logout
  // ------------------------------

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


  // ------------------------------
  // Provider
  // ------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,

        isAuthenticated: !!user,
        loading,

        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


// ------------------------------
// Hook personalizado
// ------------------------------

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