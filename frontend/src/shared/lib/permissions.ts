import type { User } from '@entities/user/types'
import type { UserRole } from '@shared/constants/roles'

export function hasAnyRole(user: User | null | undefined, roles: readonly UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function canEditUsers(user: User | null | undefined): boolean {
  return hasAnyRole(user, ['COMPANY_ADMIN'])
}

export function canEditCars(user: User | null | undefined): boolean {
  return hasAnyRole(user, ['COMPANY_ADMIN', 'DISPATCHER'])
}

export function canViewReports(user: User | null | undefined): boolean {
  return hasAnyRole(user, ['COMPANY_ADMIN', 'DISPATCHER', 'ACCOUNTANT'])
}
