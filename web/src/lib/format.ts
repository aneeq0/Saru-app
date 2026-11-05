import { format, formatDistanceToNow, parseISO } from 'date-fns'

const DEFAULT_LOCALE = 'en-PK'
const DEFAULT_CURRENCY = 'PKR'
const DEFAULT_TIME_ZONE = 'Asia/Karachi'

export function formatCurrency(
  amount: number | string,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(
  value: number | string,
  options?: Intl.NumberFormatOptions,
  locale = DEFAULT_LOCALE,
): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    ...options,
  }).format(num)
}

export function formatQuantity(value: number | string, unit?: string): string {
  const formatted = formatNumber(value, { maximumFractionDigits: 3 })
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = 'dd MMM yyyy',
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern)
}

export function formatDateTime(
  value: string | Date | null | undefined,
  pattern = 'dd MMM yyyy, HH:mm',
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern)
}

export function formatRelative(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

export const localeDefaults = {
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
  timeZone: DEFAULT_TIME_ZONE,
} as const
