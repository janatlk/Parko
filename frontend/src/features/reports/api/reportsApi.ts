import { http } from '@shared/api/http'

export type MaintenanceCostsParams = {
  from?: string
  to?: string
  car?: number
}

export type MaintenanceCostsReport = {
  filters: {
    from: string | null
    to: string | null
    car: number | null
  }
  totals: {
    part_total: number
    job_total: number
    total: number
  }
  by_car: Array<{
    car_id: number
    car__numplate: string
    part_total: number
    job_total: number
    total: number
  }>
}

export async function getMaintenanceCostsReport(
  params: MaintenanceCostsParams = {},
): Promise<MaintenanceCostsReport> {
  const { data } = await http.get<MaintenanceCostsReport>('reports/maintenance-costs/', {
    params: {
      from: params.from,
      to: params.to,
      car: params.car,
    },
  })
  return data
}
