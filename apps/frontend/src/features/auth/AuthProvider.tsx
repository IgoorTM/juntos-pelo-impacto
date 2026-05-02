import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './AuthContext'
import type { AuthUser, AuthContextValue } from './AuthContext'
import { httpClient } from '@/lib/httpClient'

const TOKEN_KEY = 'accessToken'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    httpClient
      .get<AuthUser>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setAccessToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await httpClient.post<{ accessToken: string; user: AuthUser }>(
      '/auth/sign-in',
      { email, password }
    )
    localStorage.setItem(TOKEN_KEY, res.data.accessToken)
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await httpClient.post('/auth/sign-up', { name, email, password })
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
