import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Insurance } from '@entities/fleet/types'

import { createInsurance, listInsurances, updateInsurance, deleteInsurance } from '../api/insuranceApi'
import type { InsuranceCreatePayload, InsuranceUpdatePayload, ListInsurancesParams } from '../api/insuranceApi'

type InsurancesQueryArgs = {
  page: number
  car?: number
}

const insuranceKeys = {
  all: ['insurances'] as const,
  list: (args: InsurancesQueryArgs) => [...insuranceKeys.all, 'list', args] as const,
}

export function useInsurancesQuery(args: InsurancesQueryArgs) {
  const params: ListInsurancesParams = {
    page: args.page,
    car: args.car,
  }

  return useQuery<PaginatedResponse<Insurance>>({
    queryKey: insuranceKeys.list(args),
    queryFn: () => listInsurances(params),
  })
}

export function useCreateInsuranceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InsuranceCreatePayload) => createInsurance(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['insurances'] })
    },
  })
}

export function useUpdateInsuranceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ insuranceId, payload }: { insuranceId: number; payload: InsuranceUpdatePayload }) =>
      updateInsurance(insuranceId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['insurances'] })
    },
  })
}

export function useDeleteInsuranceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (insuranceId: number) => deleteInsurance(insuranceId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['insurances'] })
    },
  })
}
