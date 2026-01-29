import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Insurance } from '@entities/fleet/types'

export type ListInsurancesParams = {
  page?: number
  car?: number
  insurance_type?: string
  start_date__gte?: string
  start_date__lte?: string
  end_date__gte?: string
  end_date__lte?: string
  search?: string
  ordering?: string
}

export type InsuranceCreatePayload = {
  car: number
  insurance_type: string
  number: string
  start_date: string
  end_date: string
  cost: number
}

export async function listInsurances(
  params: ListInsurancesParams = {},
): Promise<PaginatedResponse<Insurance>> {
  const { data } = await http.get<PaginatedResponse<Insurance>>('insurances/', {
    params,
  })
  return data
}

export async function createInsurance(payload: InsuranceCreatePayload): Promise<Insurance> {
  const { data } = await http.post<Insurance>('insurances/', payload)
  return data
}
