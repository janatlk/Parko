import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { LoginRequest } from '@entities/auth/types'
import type { User } from '@entities/user/types'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@shared/api/tokenStorage'

import { loginApi, logoutApi, meApi, refreshApi } from '@features/auth/api/authApi'

import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const access = getAccessToken()
    const refresh = getRefreshToken()

    if (!access || !refresh) {
      setIsLoading(false)
      setUser(null)
      return
    }

    try {
      const me = await meApi()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const login = useCallback(async (payload: LoginRequest) => {
    const data = await loginApi(payload)
    setTokens({ access: data.access, refresh: data.refresh })

    try {
      const me = await meApi()
      setUser(me)
    } catch {
      setUser(data.user)
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) {
        await logoutApi({ refresh })
      }
    } finally {
      clearTokens()
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const refresh = getRefreshToken()
    if (!refresh) {
      clearTokens()
      setUser(null)
      return
    }

    try {
      const data = await refreshApi({ refresh })
      setTokens({ access: data.access, refresh: data.refresh })
      if (user) {
        const me = await meApi()
        setUser(me)
      }
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refresh,
      setUser,
    }),
    [isLoading, login, logout, refresh, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
