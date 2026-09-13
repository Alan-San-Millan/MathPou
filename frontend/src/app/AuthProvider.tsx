import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearTokens,
  getAccessToken,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  setTokens,
  type User,
} from '../shared/api/client'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    meRequest()
      .then(setUser)
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(identifier, password) {
        const tokens = await loginRequest(identifier, password)
        setTokens(tokens.access, tokens.refresh)
        setUser(await meRequest())
      },
      async register(username, email, password) {
        const created = await registerRequest(username, email, password)
        setTokens(created.access, created.refresh)
        setUser(created.user)
      },
      async logout() {
        try {
          await logoutRequest()
        } finally {
          clearTokens()
          setUser(null)
        }
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
