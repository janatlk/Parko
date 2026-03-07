import { useQuery } from '@tanstack/react-query'

import {
  getDashboardStats,
  getExpiringItems,
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
