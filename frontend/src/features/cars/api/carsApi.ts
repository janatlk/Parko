import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'
import type { Car, CarStatus } from '@entities/car/types'

export type CarListItem = Pick<Car, 'id' | 'brand' | 'title' | 'numplate' | 'status' | 'driver'>

export type ListCarsParams = {
  page?: number
  search?: string
  status?: CarStatus
  brand?: string
  region?: string
  ordering?: string
}

export type CarCreatePayload = {
  region: string
  brand: string
  title: string
  numplate: string
  year?: number | null
  vin?: string | null
  fueltype: string
  type: string
  driver?: string
  drivers_phone?: string | null
  fuel_card?: string
  status?: CarStatus
  commissioned_at?: string | null
}

export async function listCars(params: ListCarsParams = {}): Promise<PaginatedResponse<CarListItem>> {
  const { data } = await http.get<PaginatedResponse<CarListItem>>('cars/', {
    params: {
      page: params.page,
      search: params.search,
      status: params.status,
      brand: params.brand,
      region: params.region,
      ordering: params.ordering,
    },
  })
  return data
}

export async function createCar(payload: CarCreatePayload): Promise<Car> {
  const { data } = await http.post<Car>('cars/', payload)
  return data
}

export async function getCar(carId: number): Promise<Car> {
  const { data } = await http.get<Car>(`cars/${carId}/`)
  return data
}
