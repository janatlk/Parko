import { http } from '@shared/api/http'
import type { LoginRequest, LoginResponse, RefreshRequest, RefreshResponse } from '@entities/auth/types'
import type { User } from '@entities/user/types'

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('auth/login/', payload)
  return data
}

export async function refreshApi(payload: RefreshRequest): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('auth/refresh/', payload)
  return data
}

export async function logoutApi(payload: { refresh: string }): Promise<void> {
  await http.post('auth/logout/', payload)
}

export async function meApi(): Promise<User> {
  const { data } = await http.get<User>('auth/me/')
  return data
}

export type MeUpdatePayload = Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'region' | 'language'>>

export async function patchMeApi(payload: MeUpdatePayload): Promise<User> {
  const { data } = await http.patch<User>('auth/me/', payload)
  return data
}
