/**
 * Format a price value with the user's currency
 * @param value - The numeric value to format
 * @param currency - The currency code (KGS, USD, EUR, RUB)
 * @returns Formatted string with currency suffix
 */
export function formatPrice(value: number | string, currency: string = 'KGS'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0'
  
  // Format the number (no decimals for simplicity)
  const formatted = Math.round(numValue).toLocaleString()
  
  // Return with currency suffix
  return `${formatted} ${currency}`
}

/**
 * Get currency symbol for display
 * @param currency - The currency code (KGS, USD, EUR, RUB)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'RUB':
      return '₽'
    case 'KGS':
    default:
      return 'сом'
  }
}
