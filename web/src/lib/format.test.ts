import { describe, expect, it } from 'vitest'
import { formatCurrency, formatNumber, formatQuantity } from './format'

describe('format helpers', () => {
  it('formats PKR currency with decimals', () => {
    const result = formatCurrency(1250000.5, 'PKR')
    expect(result).toContain('1')
    expect(result.length).toBeGreaterThan(3)
  })

  it('returns em dash for invalid numbers', () => {
    expect(formatNumber(Number.NaN)).toBe('—')
  })

  it('appends unit to quantity', () => {
    expect(formatQuantity(12, 'Box')).toContain('Box')
  })
})
