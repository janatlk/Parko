export const LANGUAGES = ['ru', 'en', 'ky'] as const

export type Language = (typeof LANGUAGES)[number]
