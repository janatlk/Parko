import { useQuery } from '@tanstack/react-query'

import {
  getDashboardStats,
  getExpiringItems,
  getActivityFeed,
  getCostByMonth,
  getVehicleConsumption,
  getFuelStatsByMonth,
  getRecentFuelEntries,
} from '../api/dashboardApi'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    retry: 1,
  })
}

export function useExpiringItems() {
  return useQuery({
    queryKey: ['dashboard', 'expiring'],
    queryFn: getExpiringItems,
    retry: 1,
  })
}

export function useActivityFeed(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'activity-feed', limit],
    queryFn: () => getActivityFeed(limit),
    retry: 1,
  })
}

export function useCostByMonth(months = 6) {
  return useQuery({
    queryKey: ['dashboard', 'cost-by-month', months],
    queryFn: () => getCostByMonth(months),
    retry: 1,
  })
}

export function useVehicleConsumption(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'vehicle-consumption', limit],
    queryFn: () => getVehicleConsumption(limit),
    retry: 1,
  })
}

export function useRecentFuelEntries(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'recent-fuel', limit],
    queryFn: () => getRecentFuelEntries(limit),
    retry: 1,
  })
}

export function useFuelStatsByMonth(months = 6) {
  return useQuery({
    queryKey: ['dashboard', 'fuel-by-month', months],
    queryFn: () => getFuelStatsByMonth(months),
    retry: 1,
    select: (data) => {
      // Ensure data is sorted by month
      return [...data].sort((a, b) => a.month - b.month)
    },
  })
}
