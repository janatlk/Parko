import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Spare } from '@entities/fleet/types'

export type ListSparesParams = {
  page?: number
  car?: number
  search?: string
  ordering?: string
  installed_at__year?: number
  installed_at__month?: number
}

export async function listSpares(params: ListSparesParams = {}): Promise<PaginatedResponse<Spare>> {
  const { data } = await http.get<PaginatedResponse<Spare>>('spares/', { params })
  return data
}

export async function createSpare(data: Partial<Spare>): Promise<Spare> {
  const { data: response } = await http.post<Spare>('spares/', data)
  return response
}

export async function updateSpare(id: number, data: Partial<Spare>): Promise<Spare> {
  const { data: response } = await http.patch<Spare>(`spares/${id}/`, data)
  return response
}

export async function deleteSpare(id: number): Promise<void> {
  await http.delete(`spares/${id}/`)
}
