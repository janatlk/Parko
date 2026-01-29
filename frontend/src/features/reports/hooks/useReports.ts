import { useQuery } from '@tanstack/react-query'

import { getMaintenanceCostsReport } from '../api/reportsApi'
import type { MaintenanceCostsParams, MaintenanceCostsReport } from '../api/reportsApi'

const reportsKeys = {
  all: ['reports'] as const,
  maintenanceCosts: (args: MaintenanceCostsParams) => [...reportsKeys.all, 'maintenance-costs', args] as const,
}

export function useMaintenanceCostsReportQuery(args: MaintenanceCostsParams) {
  return useQuery<MaintenanceCostsReport>({
    queryKey: reportsKeys.maintenanceCosts(args),
    queryFn: () => getMaintenanceCostsReport(args),
  })
}
