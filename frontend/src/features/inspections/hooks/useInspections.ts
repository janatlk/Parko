import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Inspection } from '@entities/fleet/types'

import { createInspection, listInspections, updateInspection } from '../api/inspectionsApi'
import type { InspectionCreatePayload, InspectionUpdatePayload, ListInspectionsParams } from '../api/inspectionsApi'

type InspectionsQueryArgs = {
  page: number
  car?: number
}

const inspectionsKeys = {
  all: ['inspections'] as const,
  list: (args: InspectionsQueryArgs) => [...inspectionsKeys.all, 'list', args] as const,
}

export function useInspectionsQuery(args: InspectionsQueryArgs) {
  const params: ListInspectionsParams = {
    page: args.page,
    car: args.car,
  }

  return useQuery<PaginatedResponse<Inspection>>({
    queryKey: inspectionsKeys.list(args),
    queryFn: () => listInspections(params),
  })
}

export function useCreateInspectionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InspectionCreatePayload) => createInspection(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}

export function useUpdateInspectionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ inspectionId, payload }: { inspectionId: number; payload: InspectionUpdatePayload }) =>
      updateInspection(inspectionId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['inspections'] })
    },
  })
}
