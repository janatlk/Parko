import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Car } from '@entities/car/types'

import { createCar, getCar, listCars, updateCar, deleteCar } from '../api/carsApi'
import type { CarCreatePayload, CarListItem, ListCarsParams, CarUpdatePayload } from '../api/carsApi'

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
      // Invalidate all car-related queries
      await qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

export function useUpdateCarMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ carId, payload }: { carId: number; payload: CarUpdatePayload }) =>
      updateCar(carId, payload),
    onSuccess: async () => {
      // Invalidate all car-related queries
      await qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}

export function useCarQuery(carId: number) {
  return useQuery<Car>({
    queryKey: carsKeys.detail(carId),
    queryFn: () => getCar(carId),
  })
}

export function useDeleteCarMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (carId: number) => deleteCar(carId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}
