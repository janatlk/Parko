export const USER_ROLES = [
  'COMPANY_ADMIN',
  'DISPATCHER',
  'MECHANIC',
  'DRIVER',
  'ACCOUNTANT',
  'GUEST',
] as const

export type UserRole = (typeof USER_ROLES)[number]
