import { http } from '@shared/api/http'

export type DashboardStats = {
  total_cars: number
  active_cars: number
  maintenance_cars: number
  inactive_cars: number
  total_fuel_cost_month: number
  total_fuel_cost_prev_month: number
  total_maintenance_cost_month: number
  total_maintenance_cost_prev_month: number
  total_operational_cost: number
  prev_operational_cost: number
  active_insurances: number
  active_inspections: number
  expiring_items_count: number
  avg_fuel_consumption: number
  prev_avg_fuel_consumption: number
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

export type ExpiringItemsResponse = {
  items: ExpiringItem[]
  total_renewal_cost: number
}

export type ActivityFeedItem = {
  id: number
  type: 'fuel' | 'maintenance' | 'car_added' | 'car_edited'
  car_id: number
  car_numplate: string
  title: string
  description: string
  date: string
  cost: number
}

export type CostByMonth = {
  year: number
  month: number
  month_name: string
  fuel_cost: number
  spare_cost: number
  insurance_cost: number
  inspection_cost: number
  tires_cost: number
  accumulator_cost: number
  total_cost: number
  fuel_liters: number
}

export type VehicleConsumption = {
  id: number
  numplate: string
  brand: string
  title: string
  total_fuel_liters: number
  total_cost: number
  avg_consumption: number
  records_count: number
  last_updated: string | null
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

export async function getExpiringItems(): Promise<ExpiringItemsResponse> {
  const { data } = await http.get<ExpiringItemsResponse>('dashboard/expiring/')
  return data
}

export async function getActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
  const { data } = await http.get<ActivityFeedItem[]>('dashboard/activity-feed/', { params: { limit } })
  return data
}

export async function getCostByMonth(months = 6): Promise<CostByMonth[]> {
  const { data } = await http.get<CostByMonth[]>('dashboard/cost-by-month/', { params: { months } })
  return data
}

export async function getVehicleConsumption(limit = 10): Promise<VehicleConsumption[]> {
  const { data } = await http.get<VehicleConsumption[]>('dashboard/vehicle-consumption/', { params: { limit } })
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
