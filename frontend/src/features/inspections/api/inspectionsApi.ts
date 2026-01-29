import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Inspection } from '@entities/fleet/types'

export type ListInspectionsParams = {
  page?: number
  car?: number
  inspected_at__gte?: string
  inspected_at__lte?: string
  search?: string
  ordering?: string
}

export type InspectionCreatePayload = {
  car: number
  number: string
  inspected_at: string
  cost: number
}

export async function listInspections(
  params: ListInspectionsParams = {},
): Promise<PaginatedResponse<Inspection>> {
  const { data } = await http.get<PaginatedResponse<Inspection>>('inspections/', {
    params,
  })
  return data
}

export async function createInspection(payload: InspectionCreatePayload): Promise<Inspection> {
  const { data } = await http.post<Inspection>('inspections/', payload)
  return data
}
