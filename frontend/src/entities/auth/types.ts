import type { User } from '@entities/user/types'

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  access: string
  refresh: string
  user: User
}

export type RefreshRequest = {
  refresh: string
}

export type RefreshResponse = {
  access: string
  refresh?: string
}
