import { differenceInCalendarDays, parseISO, startOfDay, subDays } from 'date-fns'

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name?: string | null): string {
  if (!name?.trim()) return 'SI'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part.charAt(0)).join('')
  return letters.toUpperCase() || 'SI'
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null
  return differenceInCalendarDays(parseISO(value), startOfDay(new Date()))
}

export function deadlineLabel(value?: string | null): { text: string; tone: 'neutral' | 'warning' | 'danger' } | null {
  const days = daysUntil(value)
  if (days == null) return null
  if (days < -14) return { text: 'Overdue', tone: 'danger' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'danger' }
  if (days === 0) return { text: 'Due today', tone: 'danger' }
  if (days === 1) return { text: 'Due tomorrow', tone: 'warning' }
  if (days <= 7) return { text: `${days}d left`, tone: 'warning' }
  return { text: `${days}d left`, tone: 'neutral' }
}

export type NotificationGroup = 'Today' | 'Yesterday' | 'Earlier'

export function notificationGroup(createdAt: string, now = new Date()): NotificationGroup {
  const date = parseISO(createdAt)
  const today = startOfDay(now)
  if (date >= today) return 'Today'
  if (date >= subDays(today, 1)) return 'Yesterday'
  return 'Earlier'
}

export function hrefForRecordType(type: string): '/tenders' | '/documents' | '/securities' | '/deliveries' | '/approvals' | '/imports' | '/invoices' | '/(tabs)/tasks' {
  const value = type.toLowerCase()
  if (value.includes('tender')) return '/tenders'
  if (value.includes('document')) return '/documents'
  if (value.includes('secur') || value.includes('cdr')) return '/securities'
  if (value.includes('deliver')) return '/deliveries'
  if (value.includes('approv')) return '/approvals'
  if (value.includes('ship') || value.includes('import') || value.includes('receipt')) return '/imports'
  if (value.includes('invoice') || value.includes('payment') || value.includes('balance')) return '/invoices'
  return '/(tabs)/tasks'
}

const CLOSED_TENDER = new Set(['awarded', 'rejected', 'cancelled', 'closed', 'partially_awarded'])

export function tenderDeadlineTone(stage: string, dueDate: string): 'neutral' | 'warning' | 'danger' {
  if (CLOSED_TENDER.has(stage)) return 'neutral'
  return deadlineLabel(dueDate)?.tone ?? 'neutral'
}
