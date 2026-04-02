import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Fuel, Insurance, Inspection, Spare, Tire, Accumulator, CarPhoto } from '@entities/fleet/types'

export type ListParams = {
  page?: number
  car?: number
  ordering?: string
}

export type CarRelatedStats = {
  fuel_records: number
  spares: number
  insurances: number
  inspections: number
  tires: number
  accumulators: number
  photos: number
  total: number
}

// Fuel
export async function listFuelByCar(params: ListParams = {}): Promise<PaginatedResponse<Fuel>> {
  const { data } = await http.get<PaginatedResponse<Fuel>>('fuel/', { params })
  return data
}

// Insurances
export async function listInsurancesByCar(params: ListParams = {}): Promise<PaginatedResponse<Insurance>> {
  const { data } = await http.get<PaginatedResponse<Insurance>>('insurances/', { params })
  return data
}

// Inspections
export async function listInspectionsByCar(params: ListParams = {}): Promise<PaginatedResponse<Inspection>> {
  const { data } = await http.get<PaginatedResponse<Inspection>>('inspections/', { params })
  return data
}

// Spares
export async function listSparesByCar(params: ListParams = {}): Promise<PaginatedResponse<Spare>> {
  const { data } = await http.get<PaginatedResponse<Spare>>('spares/', { params })
  return data
}

// Tires
export async function listTiresByCar(params: ListParams = {}): Promise<PaginatedResponse<Tire>> {
  const { data } = await http.get<PaginatedResponse<Tire>>('tires/', { params })
  return data
}

// Accumulators
export async function listAccumulatorsByCar(params: ListParams = {}): Promise<PaginatedResponse<Accumulator>> {
  const { data } = await http.get<PaginatedResponse<Accumulator>>('accumulators/', { params })
  return data
}

// Photos
export async function listPhotosByCar(carId: number): Promise<CarPhoto[]> {
  const { data } = await http.get<CarPhoto[]>(`cars/${carId}/photos/`)
  return data
}

export async function deletePhoto(photoId: number): Promise<void> {
  await http.delete(`cars/photos/${photoId}/`)
}

// Car Related Stats
export async function getCarRelatedStats(carId: number): Promise<CarRelatedStats> {
  const { data } = await http.get<CarRelatedStats>(`cars/${carId}/stats/`)
  return data
}
