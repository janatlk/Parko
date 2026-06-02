import { describe, it, expect } from 'vitest'
import { formatPrice, getCurrencySymbol } from './formatPrice'

describe('formatPrice', () => {
  it('formats number with default KGS currency', () => {
    expect(formatPrice(1500)).toBe('1\u00A0500 KGS')
  })

  it('formats string value correctly', () => {
    expect(formatPrice('2500.50')).toBe('2\u00A0501 KGS')
  })

  it('uses provided currency', () => {
    expect(formatPrice(100, 'USD')).toBe('100 USD')
  })

  it('returns "0" for invalid string', () => {
    expect(formatPrice('not-a-number')).toBe('0')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0 KGS')
  })

  it('rounds decimal values', () => {
    expect(formatPrice(99.6)).toBe('100 KGS')
  })
})

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('returns € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('returns ₽ for RUB', () => {
    expect(getCurrencySymbol('RUB')).toBe('₽')
  })

  it('returns сом for KGS', () => {
    expect(getCurrencySymbol('KGS')).toBe('сом')
  })

  it('defaults to сом for unknown currency', () => {
    expect(getCurrencySymbol('XYZ')).toBe('сом')
  })
})
