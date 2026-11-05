import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { RealtimeEventType, type RealtimeEventEnvelope } from './events'

const seen = new Map<string, number>()
const SEEN_TTL_MS = 5 * 60_000

function remember(eventId: string): boolean {
  const now = Date.now()
  for (const [id, at] of seen) {
    if (now - at > SEEN_TTL_MS) seen.delete(id)
  }
  if (seen.has(eventId)) return false
  seen.set(eventId, now)
  return true
}

/** Coalesce burst invalidations within a short window */
const pending = new Map<string, ReturnType<typeof setTimeout>>()

function invalidate(client: QueryClient, key: readonly unknown[], coalesceKey: string) {
  const existing = pending.get(coalesceKey)
  if (existing) clearTimeout(existing)
  pending.set(
    coalesceKey,
    setTimeout(() => {
      pending.delete(coalesceKey)
      void client.invalidateQueries({ queryKey: [...key] })
    }, 120),
  )
}

export function applyRealtimeEvent(client: QueryClient, event: RealtimeEventEnvelope) {
  if (!remember(event.eventId)) return

  const t = event.type
  invalidate(client, queryKeys.dashboard.all, 'dashboard')

  if (t.startsWith('product.')) {
    invalidate(client, queryKeys.products.all, 'products')
    if (event.entityId) invalidate(client, queryKeys.products.detail(event.entityId), `product:${event.entityId}`)
  }
  if (t.startsWith('inventory.') || t === RealtimeEventType.IMPORT_RECEIPT_POSTED) {
    invalidate(client, queryKeys.inventory.all, 'inventory')
  }
  if (t.startsWith('import.')) {
    invalidate(client, queryKeys.imports.all, 'imports')
  }
  if (t.startsWith('tender.')) {
    invalidate(client, queryKeys.tenders.all, 'tenders')
  }
  if (t.startsWith('contract.')) {
    invalidate(client, queryKeys.contracts.all, 'contracts')
  }
  if (t.startsWith('cdr.')) {
    invalidate(client, queryKeys.securities.all, 'securities')
  }
  if (t.startsWith('delivery.')) {
    invalidate(client, queryKeys.deliveries.all, 'deliveries')
    invalidate(client, queryKeys.inventory.all, 'inventory')
    invalidate(client, queryKeys.contracts.all, 'contracts')
  }
  if (t.startsWith('invoice.') || t.startsWith('payment.') || t.startsWith('receivable.')) {
    invalidate(client, queryKeys.invoices.all, 'invoices')
    invalidate(client, queryKeys.payments.all, 'payments')
  }
  if (t.startsWith('approval.') || t.startsWith('task.')) {
    invalidate(client, queryKeys.approvals.all, 'approvals')
    invalidate(client, queryKeys.tasks.all, 'tasks')
  }
  if (t.startsWith('notification.')) {
    invalidate(client, queryKeys.notifications.all, 'notifications')
    invalidate(client, queryKeys.notifications.unreadCount, 'notifications-unread')
  }
  if (t.startsWith('document.')) {
    invalidate(client, queryKeys.documents.all, 'documents')
  }
}

export function applyRealtimeEvents(client: QueryClient, events: RealtimeEventEnvelope[]) {
  for (const e of events) applyRealtimeEvent(client, e)
}
