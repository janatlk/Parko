import type { Id } from '@shared/api/types'
import type { Language } from '@shared/constants/languages'
import type { UserRole } from '@shared/constants/roles'

export type User = {
  id: Id
  username: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
  region: string
  language: Language
  company: Id | null
  company_name?: string
  is_active: boolean
}
