import type { Id } from '@shared/api/types'

export const CAR_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const
export type CarStatus = (typeof CAR_STATUSES)[number]

export type Car = {
  id: Id
  company?: Id
  region: string
  brand: string
  title: string
  numplate: string
  year: number | null
  vin: string | null
  fueltype: string
  type: string
  driver: string
  drivers_phone: string | null
  fuel_card: string
  status: CarStatus
  commissioned_at: string | null
  created_at?: string
  updated_at?: string
}
