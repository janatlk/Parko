import { createContext } from 'react'

import type { LoginRequest } from '@entities/auth/types'
import type { User } from '@entities/user/types'

export type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
