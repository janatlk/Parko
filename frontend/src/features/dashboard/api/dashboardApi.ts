import { http } from '@shared/api/http'

export type DashboardStats = {
  total_cars: number
  active_cars: number
  maintenance_cars: number
  inactive_cars: number
  total_fuel_records: number
  total_insurances: number
  active_insurances: number
  expiring_insurances: number
  total_inspections: number
  active_inspections: number
  expiring_inspections: number
  total_fuel_cost_month: number
  total_maintenance_cost_month: number
  avg_fuel_consumption: number
}

export type ExpiringItem = {
  id: number
  car_id: number
  car_numplate: string
  type: 'insurance' | 'inspection'
  end_date: string
  days_until_expiry: number
  cost?: number
}

export type RecentFuelEntry = {
  id: number
  car_id: number
  car_numplate: string
  month: number
  year: number
  month_name: string
  liters: number
  total_cost: number
  monthly_mileage: number
  consumption: string
  created_at: string
}

export type FuelStatsByMonth = {
  month: number
  month_name: string
  total_liters: number
  total_cost: number
  avg_consumption: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await http.get<DashboardStats>('dashboard/stats/')
  return data
}

export async function getExpiringItems(): Promise<ExpiringItem[]> {
  const { data } = await http.get<ExpiringItem[]>('dashboard/expiring/')
  return data
}

export async function getRecentFuelEntries(limit = 5): Promise<RecentFuelEntry[]> {
  const { data } = await http.get<RecentFuelEntry[]>('dashboard/recent-fuel/', { params: { limit } })
  return data
}

export async function getFuelStatsByMonth(months = 6): Promise<FuelStatsByMonth[]> {
  const { data } = await http.get<FuelStatsByMonth[]>('dashboard/fuel-by-month/', { params: { months } })
  return data
}
