import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Fuel, Insurance, Inspection, Spare, Tire, Accumulator, CarPhoto } from '@entities/fleet/types'

import {
  listFuelByCar,
  listInsurancesByCar,
  listInspectionsByCar,
  listSparesByCar,
  listTiresByCar,
  listAccumulatorsByCar,
  listPhotosByCar,
  deletePhoto,
} from '../api/carDetailApi'

const detailKeys = {
  all: ['carDetail'] as const,
  fuel: (carId: number) => [...detailKeys.all, 'fuel', carId] as const,
  insurances: (carId: number) => [...detailKeys.all, 'insurances', carId] as const,
  inspections: (carId: number) => [...detailKeys.all, 'inspections', carId] as const,
  spares: (carId: number) => [...detailKeys.all, 'spares', carId] as const,
  tires: (carId: number) => [...detailKeys.all, 'tires', carId] as const,
  accumulators: (carId: number) => [...detailKeys.all, 'accumulators', carId] as const,
  photos: (carId: number) => [...detailKeys.all, 'photos', carId] as const,
}

export function useCarFuelQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Fuel>>({
    queryKey: detailKeys.fuel(carId),
    queryFn: () => listFuelByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarInsurancesQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Insurance>>({
    queryKey: detailKeys.insurances(carId),
    queryFn: () => listInsurancesByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarInspectionsQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Inspection>>({
    queryKey: detailKeys.inspections(carId),
    queryFn: () => listInspectionsByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarSparesQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Spare>>({
    queryKey: detailKeys.spares(carId),
    queryFn: () => listSparesByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarTiresQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Tire>>({
    queryKey: detailKeys.tires(carId),
    queryFn: () => listTiresByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarAccumulatorsQuery(carId: number, page: number = 1) {
  return useQuery<PaginatedResponse<Accumulator>>({
    queryKey: detailKeys.accumulators(carId),
    queryFn: () => listAccumulatorsByCar({ page, car: carId }),
    enabled: carId > 0,
  })
}

export function useCarPhotosQuery(carId: number) {
  return useQuery<CarPhoto[]>({
    queryKey: detailKeys.photos(carId),
    queryFn: () => listPhotosByCar(carId),
    enabled: carId > 0,
  })
}

export function useDeletePhotoMutation(carId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: number) => deletePhoto(photoId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: detailKeys.photos(carId) })
    },
  })
}
