import type { ReactNode } from 'react'

import { Center, Loader } from '@mantine/core'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@features/auth/hooks/useAuth'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
