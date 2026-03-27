import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Spare } from '@entities/fleet/types'

import { listSpares, createSpare, updateSpare, deleteSpare, type ListSparesParams } from '../api/sparesApi'

const sparesKeys = {
  all: ['spares'] as const,
  lists: () => [...sparesKeys.all, 'list'] as const,
  list: (params: ListSparesParams) => [...sparesKeys.lists(), params] as const,
  details: () => [...sparesKeys.all, 'detail'] as const,
  detail: (id: number) => [...sparesKeys.details(), id] as const,
}

export { sparesKeys }

export function useSparesQuery(params: ListSparesParams = {}) {
  return useQuery<PaginatedResponse<Spare>>({
    queryKey: sparesKeys.list(params),
    queryFn: () => listSpares(params),
  })
}

export function useCreateSpareMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Spare>) => createSpare(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sparesKeys.all })
    },
  })
}

export function useUpdateSpareMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Spare> }) => updateSpare(id, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sparesKeys.all })
    },
  })
}

export function useDeleteSpareMutation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteSpare(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sparesKeys.all })
    },
  })
}
