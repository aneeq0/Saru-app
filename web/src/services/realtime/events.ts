/** Mirrors backend realtime event contract */
export const REALTIME_NAMESPACE = '/realtime'
export const REALTIME_PATH = '/socket.io'

export const RealtimeEventType = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DEACTIVATED: 'product.deactivated',
  INVENTORY_STOCK_CHANGED: 'inventory.stock.changed',
  IMPORT_CREATED: 'import.created',
  IMPORT_UPDATED: 'import.updated',
  IMPORT_RECEIPT_POSTED: 'import.receipt.posted',
  TENDER_CREATED: 'tender.created',
  TENDER_UPDATED: 'tender.updated',
  TENDER_CHECKLIST_UPDATED: 'tender.checklist.updated',
  TENDER_AWARDED: 'tender.awarded',
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_UPDATED: 'contract.updated',
  CONTRACT_FULFILMENT_CHANGED: 'contract.fulfilment.changed',
  CDR_CREATED: 'cdr.created',
  CDR_UPDATED: 'cdr.updated',
  CDR_RELEASE_REQUESTED: 'cdr.release.requested',
  CDR_RELEASED: 'cdr.released',
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_UPDATED: 'delivery.updated',
  DELIVERY_DISPATCHED: 'delivery.dispatched',
  DELIVERY_PROOF_SUBMITTED: 'delivery.proof.submitted',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_FINALIZED: 'invoice.finalized',
  INVOICE_PAYMENT_STATUS_CHANGED: 'invoice.payment.status.changed',
  PAYMENT_RECORDED: 'payment.recorded',
  PAYMENT_ALLOCATED: 'payment.allocated',
  RECEIVABLE_BALANCE_CHANGED: 'receivable.balance.changed',
  APPROVAL_CREATED: 'approval.created',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
  APPROVAL_RETURNED: 'approval.returned',
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  DOCUMENT_UPLOADED: 'document.uploaded',
  USER_DEACTIVATED: 'user.deactivated',
  PERMISSIONS_CHANGED: 'permissions.changed',
} as const

export interface RealtimeEventEnvelope {
  eventId: string
  type: string
  schemaVersion: number
  entityType: string
  entityId: string
  entityVersion?: number
  occurredAt: string
  scope: {
    rooms?: string[]
    userIds?: string[]
    warehouseIds?: string[]
  }
  changeSummary: string
  correlationId?: string
  meta?: Record<string, string | number | boolean | null>
}
