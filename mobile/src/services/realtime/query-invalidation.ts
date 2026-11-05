import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import type { RealtimeEventEnvelope } from './events'

const seen = new Set<string>()

export function applyRealtimeEvent(client: QueryClient, event: RealtimeEventEnvelope) {
  if (seen.has(event.eventId)) return
  seen.add(event.eventId)
  if (seen.size > 500) {
    const first = seen.values().next().value
    if (first) seen.delete(first)
  }

  void client.invalidateQueries({ queryKey: queryKeys.dashboard.all })

  if (event.type.startsWith('product.')) {
    void client.invalidateQueries({ queryKey: queryKeys.products.all })
  }
  if (event.type.startsWith('inventory.') || event.type.includes('receipt.posted') || event.type.includes('dispatched')) {
    void client.invalidateQueries({ queryKey: queryKeys.inventory.stock({}) })
    void client.invalidateQueries({ queryKey: ['inventory'] })
  }
  if (event.type.startsWith('import.')) {
    void client.invalidateQueries({ queryKey: ['imports'] })
  }
  if (event.type.startsWith('tender.')) {
    void client.invalidateQueries({ queryKey: ['tenders'] })
  }
  if (event.type.startsWith('contract.') || event.type.startsWith('cdr.')) {
    void client.invalidateQueries({ queryKey: ['contracts'] })
    void client.invalidateQueries({ queryKey: ['securities'] })
  }
  if (event.type.startsWith('delivery.')) {
    void client.invalidateQueries({ queryKey: ['deliveries'] })
  }
  if (event.type.startsWith('invoice.') || event.type.startsWith('payment.') || event.type.startsWith('receivable.')) {
    void client.invalidateQueries({ queryKey: ['invoices'] })
    void client.invalidateQueries({ queryKey: ['payments'] })
  }
  if (event.type.startsWith('approval.') || event.type.startsWith('task.')) {
    void client.invalidateQueries({ queryKey: ['approvals'] })
    void client.invalidateQueries({ queryKey: queryKeys.tasks.list({}) })
  }
  if (event.type.startsWith('notification.')) {
    void client.invalidateQueries({ queryKey: ['notifications'] })
  }
}
