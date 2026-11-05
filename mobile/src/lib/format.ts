import { format, formatDistanceToNow, parseISO } from 'date-fns'

const LOCALE = 'en-PK'
const CURRENCY = 'PKR'

export function formatCurrency(amount: number | string, currency = CURRENCY): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 }).format(num)
}

export function formatQuantity(value: number | string, unit?: string): string {
  const formatted = formatNumber(value)
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatDate(value?: string | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—'
  return format(parseISO(value), pattern)
}

export function formatRelative(value: string): string {
  return formatDistanceToNow(parseISO(value), { addSuffix: true })
}

export function humanize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
