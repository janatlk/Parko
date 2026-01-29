import type { Language } from '@shared/constants/languages'
import type { Id } from '@shared/api/types'

export type CompanyCurrency = 'KGS' | 'USD' | 'EUR' | 'RUB'

export type Company = {
  id: Id
  name: string
  slug: string
  country: string
  timezone: string
  default_language: Language
  default_currency: CompanyCurrency
  legal_name: string | null
  inn: string | null
  address: string | null
  phone: string | null
  email: string | null
  created_by: Id | null
  created_at: string
  updated_at: string
  is_active: boolean
}
