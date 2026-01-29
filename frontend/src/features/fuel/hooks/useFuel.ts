import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Fuel } from '@entities/fleet/types'

import { createFuel, listFuel } from '../api/fuelApi'
import type { FuelCreatePayload, ListFuelParams } from '../api/fuelApi'

type FuelQueryArgs = {
  page: number
  car?: number
  year?: number
  month?: number
}

const fuelKeys = {
  all: ['fuel'] as const,
  list: (args: FuelQueryArgs) => [...fuelKeys.all, 'list', args] as const,
}

export function useFuelQuery(args: FuelQueryArgs) {
  const params: ListFuelParams = {
    page: args.page,
    car: args.car,
    year: args.year,
    month: args.month,
  }

  return useQuery<PaginatedResponse<Fuel>>({
    queryKey: fuelKeys.list(args),
    queryFn: () => listFuel(params),
  })
}

export function useCreateFuelMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FuelCreatePayload) => createFuel(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: fuelKeys.all })
    },
  })
}
