import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Fuel } from '@entities/fleet/types'

export type ListFuelParams = {
  page?: number
  car?: number
  year?: number
  month?: number
  ordering?: string
}

export type FuelCreatePayload = {
  car: number
  year: number
  month: number
  liters: number
  total_cost: number
  monthly_mileage: number
}

export async function listFuel(params: ListFuelParams = {}): Promise<PaginatedResponse<Fuel>> {
  const { data } = await http.get<PaginatedResponse<Fuel>>('fuel/', {
    params: {
      page: params.page,
      car: params.car,
      year: params.year,
      month: params.month,
      ordering: params.ordering,
    },
  })
  return data
}

export async function createFuel(payload: FuelCreatePayload): Promise<Fuel> {
  const { data } = await http.post<Fuel>('fuel/', payload)
  return data
}
