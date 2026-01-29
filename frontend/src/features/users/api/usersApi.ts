import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { User } from '@entities/user/types'

type ListUsersParams = {
  page?: number
}

export type UserCreatePayload = {
  username: string
  password: string
  first_name?: string
  last_name?: string
  email?: string
  role: User['role']
  region?: string
  language: User['language']
  is_active?: boolean
}

export type UserUpdatePayload = {
  username?: string
  password?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: User['role']
  region?: string
  language?: User['language']
  is_active?: boolean
}

export async function listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
  const { data } = await http.get<PaginatedResponse<User>>('users/', {
    params: {
      page: params.page,
    },
  })
  return data
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const { data } = await http.post<User>('users/', payload)
  return data
}

export async function updateUser(userId: number, payload: UserUpdatePayload): Promise<User> {
  const { data } = await http.patch<User>(`users/${userId}/`, payload)
  return data
}

export async function deleteUser(userId: number): Promise<void> {
  await http.delete(`users/${userId}/`)
}
