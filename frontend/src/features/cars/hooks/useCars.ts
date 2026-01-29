import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Car } from '@entities/car/types'

import { createCar, getCar, listCars } from '../api/carsApi'
import type { CarCreatePayload, CarListItem, ListCarsParams } from '../api/carsApi'

type CarsQueryArgs = {
  page: number
  search?: string
  status?: Car['status']
}

const carsKeys = {
  all: ['cars'] as const,
  list: (args: CarsQueryArgs) => [...carsKeys.all, 'list', args] as const,
  detail: (carId: number) => [...carsKeys.all, 'detail', carId] as const,
}

export function useCarsQuery(args: CarsQueryArgs) {
  const params: ListCarsParams = {
    page: args.page,
    search: args.search,
    status: args.status,
  }

  return useQuery<PaginatedResponse<CarListItem>>({
    queryKey: carsKeys.list(args),
    queryFn: () => listCars(params),
  })
}

export function useCreateCarMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CarCreatePayload) => createCar(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: carsKeys.all })
    },
  })
}

export function useCarQuery(carId: number) {
  return useQuery<Car>({
    queryKey: carsKeys.detail(carId),
    queryFn: () => getCar(carId),
  })
}
