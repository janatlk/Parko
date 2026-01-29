import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { Inspection } from '@entities/fleet/types'

import { createInspection, listInspections } from '../api/inspectionsApi'
import type { InspectionCreatePayload, ListInspectionsParams } from '../api/inspectionsApi'

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
      await qc.invalidateQueries({ queryKey: inspectionsKeys.all })
    },
  })
}
