import type { Id } from '@shared/api/types'

export type CarPhoto = {
  id: Id
  car: Id
  image: string
  comment: string
  uploaded_at: string
}

export type Spare = {
  id: Id
  car: Id
  car_numplate?: string
  title: string
  description?: string
  part_price: number
  job_description?: string
  job_price: number
  installed_at: string
  created_at?: string
  updated_at?: string
}

export type Tire = {
  id: Id
  car: Id
  car_numplate?: string
  model: string
  size: string
  price: number
  photo?: string | null
  installed_at: string
  expires_at: string | null
  created_at?: string
  updated_at?: string
}

export type Accumulator = {
  id: Id
  car: Id
  car_numplate?: string
  model: string
  serial_number: string
  capacity: string
  price: number
  installed_at: string
  expires_at: string | null
  photo?: string | null
  created_at?: string
  updated_at?: string
}

export type Fuel = {
  id: Id
  car: Id
  car_numplate?: string
  year: number
  month: number
  month_name?: string
  liters: number
  total_cost: number
  monthly_mileage: number
  consumption: string
  created_at?: string
  updated_at?: string
}

export type Insurance = {
  id: Id
  car: Id
  car_numplate?: string
  insurance_type: string
  number: string
  start_date: string
  end_date: string
  cost: number
  created_at?: string
  updated_at?: string
}

export type Inspection = {
  id: Id
  car: Id
  car_numplate?: string
  number: string
  inspected_at: string
  cost: number
  created_at?: string
  updated_at?: string
}
