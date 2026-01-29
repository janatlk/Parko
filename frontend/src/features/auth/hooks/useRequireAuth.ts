import { useEffect } from 'react'

import { useAuth } from './useAuth'

type Options = {
  redirectTo?: string
}

export function useRequireAuth(options: Options = {}) {
  const { redirectTo = '/login' } = options
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      window.location.assign(redirectTo)
    }
  }, [isLoading, redirectTo, user])

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  }
}
