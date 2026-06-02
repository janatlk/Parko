import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Fuel } from '@entities/fleet/types'

export type ListFuelParams = {
  page?: number
  page_size?: number
  car?: number
  ordering?: string
}

export type FuelCreatePayload = {
  car: number
  date: string
  liters: number
  total_cost: number
  odometer: number
}

export type FuelUpdatePayload = Partial<FuelCreatePayload>

export async function listFuel(params: ListFuelParams = {}): Promise<PaginatedResponse<Fuel>> {
  const { data } = await http.get<PaginatedResponse<Fuel>>('fuel/', {
    params: {
      page: params.page,
      page_size: params.page_size,
      car: params.car,
      ordering: params.ordering,
    },
  })
  return data
}

export async function createFuel(payload: FuelCreatePayload): Promise<Fuel> {
  const { data } = await http.post<Fuel>('fuel/', payload)
  return data
}

export async function updateFuel(fuelId: number, payload: FuelUpdatePayload): Promise<Fuel> {
  const { data } = await http.patch<Fuel>(`fuel/${fuelId}/`, payload)
  return data
}

export async function deleteFuel(fuelId: number): Promise<void> {
  await http.delete(`fuel/${fuelId}/`)
}

export async function bulkDeleteFuel(ids: number[]): Promise<{ status: string; deleted: number }> {
  const { data } = await http.post<{ status: string; deleted: number }>('fuel/bulk-delete/', { ids })
  return data
}
