/**
 * Shared realtime event contract (backend source of truth).
 * Frontends mirror these constants — keep in sync with docs/integration/REALTIME_EVENT_CONTRACT.md
 */

export const REALTIME_NAMESPACE = '/realtime';
export const REALTIME_PATH = '/socket.io';
export const REALTIME_SCHEMA_VERSION = 1;

export const RealtimeEventType = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DEACTIVATED: 'product.deactivated',
  PRODUCT_VARIANT_UPDATED: 'product.variant.updated',

  IMPORT_CREATED: 'import.created',
  IMPORT_UPDATED: 'import.updated',
  IMPORT_STATUS_CHANGED: 'import.status.changed',
  IMPORT_RECEIPT_SUBMITTED: 'import.receipt.submitted',
  IMPORT_RECEIPT_APPROVED: 'import.receipt.approved',
  IMPORT_RECEIPT_POSTED: 'import.receipt.posted',
  IMPORT_DISCREPANCY_CREATED: 'import.discrepancy.created',

  INVENTORY_STOCK_CHANGED: 'inventory.stock.changed',
  INVENTORY_RESERVATION_CHANGED: 'inventory.reservation.changed',
  INVENTORY_ADJUSTMENT_REQUESTED: 'inventory.adjustment.requested',
  INVENTORY_ADJUSTMENT_APPROVED: 'inventory.adjustment.approved',
  INVENTORY_TRANSFER_CHANGED: 'inventory.transfer.changed',
  INVENTORY_COUNT_SUBMITTED: 'inventory.count.submitted',
  INVENTORY_BATCH_EXPIRING: 'inventory.batch.expiring',
  INVENTORY_SHORTAGE_DETECTED: 'inventory.shortage.detected',

  TENDER_CREATED: 'tender.created',
  TENDER_UPDATED: 'tender.updated',
  TENDER_STATUS_CHANGED: 'tender.status.changed',
  TENDER_BID_SUBMITTED: 'tender.bid.submitted',
  TENDER_DEADLINE_APPROACHING: 'tender.deadline.approaching',
  TENDER_AWARDED: 'tender.awarded',
  TENDER_CHECKLIST_UPDATED: 'tender.checklist.updated',

  CONTRACT_CREATED: 'contract.created',
  CONTRACT_UPDATED: 'contract.updated',
  CONTRACT_AMENDED: 'contract.amended',
  CONTRACT_FULFILMENT_CHANGED: 'contract.fulfilment.changed',
  CONTRACT_CLOSED: 'contract.closed',

  CDR_CREATED: 'cdr.created',
  CDR_UPDATED: 'cdr.updated',
  CDR_EXPIRY_WARNING: 'cdr.expiry.warning',
  CDR_RELEASE_REQUESTED: 'cdr.release.requested',
  CDR_RELEASED: 'cdr.released',

  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_UPDATED: 'delivery.updated',
  DELIVERY_PICKING_UPDATED: 'delivery.picking.updated',
  DELIVERY_DISPATCHED: 'delivery.dispatched',
  DELIVERY_PROOF_SUBMITTED: 'delivery.proof.submitted',
  DELIVERY_DELIVERED: 'delivery.delivered',
  DELIVERY_RETURN_RECORDED: 'delivery.return.recorded',

  INVOICE_CREATED: 'invoice.created',
  INVOICE_UPDATED: 'invoice.updated',
  INVOICE_APPROVAL_REQUESTED: 'invoice.approval.requested',
  INVOICE_FINALIZED: 'invoice.finalized',
  INVOICE_AMENDED: 'invoice.amended',
  INVOICE_PAYMENT_STATUS_CHANGED: 'invoice.payment.status.changed',

  PAYMENT_RECORDED: 'payment.recorded',
  PAYMENT_ALLOCATED: 'payment.allocated',
  RECEIVABLE_BALANCE_CHANGED: 'receivable.balance.changed',
  PAYMENT_OVERDUE: 'payment.overdue',

  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_VALIDATED: 'document.validated',
  DOCUMENT_UPDATED: 'document.updated',
  DOCUMENT_EXPIRING: 'document.expiring',

  APPROVAL_CREATED: 'approval.created',
  APPROVAL_ASSIGNED: 'approval.assigned',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
  APPROVAL_RETURNED: 'approval.returned',

  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',

  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  PERMISSIONS_CHANGED: 'permissions.changed',
  SETTINGS_CHANGED: 'settings.changed',

  REPORT_JOB_STARTED: 'report.job.started',
  REPORT_JOB_COMPLETED: 'report.job.completed',
  REPORT_JOB_FAILED: 'report.job.failed',
} as const;

export type RealtimeEventTypeName =
  (typeof RealtimeEventType)[keyof typeof RealtimeEventType];

/** Legacy outbox type strings → canonical event types */
export const LEGACY_OUTBOX_TYPE_MAP: Record<string, RealtimeEventTypeName> = {
  GoodsReceiptPosted: RealtimeEventType.IMPORT_RECEIPT_POSTED,
  DispatchConfirmed: RealtimeEventType.DELIVERY_DISPATCHED,
};

export interface RealtimeScope {
  rooms?: string[];
  userIds?: string[];
  warehouseIds?: string[];
  permissionsAny?: string[];
}

export interface RealtimeEventEnvelope {
  eventId: string;
  type: string;
  schemaVersion: number;
  entityType: string;
  entityId: string;
  entityVersion?: number;
  occurredAt: string;
  scope: RealtimeScope;
  changeSummary: string;
  correlationId?: string;
  /** Safe, non-confidential hints only */
  meta?: Record<string, string | number | boolean | null>;
}

/** Minimum permission required to receive an event type via change-feed / rooms */
export const EVENT_PERMISSION_GATES: Partial<Record<string, string[]>> = {
  [RealtimeEventType.PRODUCT_CREATED]: ['products:view'],
  [RealtimeEventType.PRODUCT_UPDATED]: ['products:view'],
  [RealtimeEventType.PRODUCT_DEACTIVATED]: ['products:view'],
  [RealtimeEventType.INVENTORY_STOCK_CHANGED]: ['inventory:view'],
  [RealtimeEventType.IMPORT_CREATED]: ['imports:view'],
  [RealtimeEventType.IMPORT_UPDATED]: ['imports:view'],
  [RealtimeEventType.IMPORT_RECEIPT_POSTED]: ['imports:view', 'inventory:view'],
  [RealtimeEventType.TENDER_CREATED]: ['tenders:view'],
  [RealtimeEventType.TENDER_UPDATED]: ['tenders:view'],
  [RealtimeEventType.TENDER_CHECKLIST_UPDATED]: ['tenders:view'],
  [RealtimeEventType.TENDER_AWARDED]: ['tenders:view'],
  [RealtimeEventType.CONTRACT_CREATED]: ['contracts:view'],
  [RealtimeEventType.CONTRACT_UPDATED]: ['contracts:view'],
  [RealtimeEventType.CONTRACT_FULFILMENT_CHANGED]: ['contracts:view'],
  [RealtimeEventType.CDR_CREATED]: ['securities:view'],
  [RealtimeEventType.CDR_UPDATED]: ['securities:view'],
  [RealtimeEventType.CDR_RELEASE_REQUESTED]: ['securities:view'],
  [RealtimeEventType.CDR_RELEASED]: ['securities:view'],
  [RealtimeEventType.DELIVERY_CREATED]: ['deliveries:view'],
  [RealtimeEventType.DELIVERY_ASSIGNED]: ['deliveries:view'],
  [RealtimeEventType.DELIVERY_DISPATCHED]: [
    'deliveries:view',
    'inventory:view',
  ],
  [RealtimeEventType.DELIVERY_UPDATED]: ['deliveries:view'],
  [RealtimeEventType.INVOICE_CREATED]: ['invoices:view'],
  [RealtimeEventType.INVOICE_FINALIZED]: ['invoices:view'],
  [RealtimeEventType.INVOICE_PAYMENT_STATUS_CHANGED]: ['invoices:view'],
  [RealtimeEventType.PAYMENT_RECORDED]: ['payments:view'],
  [RealtimeEventType.PAYMENT_ALLOCATED]: ['payments:view'],
  [RealtimeEventType.RECEIVABLE_BALANCE_CHANGED]: [
    'receivables:view',
    'payments:view',
  ],
  [RealtimeEventType.APPROVAL_CREATED]: ['approvals:view'],
  [RealtimeEventType.APPROVAL_APPROVED]: ['approvals:view'],
  [RealtimeEventType.APPROVAL_REJECTED]: ['approvals:view'],
  [RealtimeEventType.APPROVAL_RETURNED]: ['approvals:view'],
  [RealtimeEventType.DOCUMENT_UPLOADED]: ['documents:view'],
  [RealtimeEventType.NOTIFICATION_CREATED]: ['notifications:view'],
  [RealtimeEventType.NOTIFICATION_READ]: ['notifications:view'],
  [RealtimeEventType.USER_DEACTIVATED]: ['employees:view'],
  [RealtimeEventType.PERMISSIONS_CHANGED]: ['roles:view'],
};

export function userCanReceiveEvent(
  permissions: string[],
  eventType: string,
  scope: RealtimeScope,
  userId: string,
): boolean {
  if (scope.userIds?.length && !scope.userIds.includes(userId)) {
    // Still allow if user is not in explicit list only when no user filter — if filtered, must match
    return false;
  }
  const gates = EVENT_PERMISSION_GATES[eventType];
  if (!gates || gates.length === 0) return true;
  const set = new Set(permissions);
  return gates.some((p) => set.has(p));
}

export function roomForUser(userId: string) {
  return `user:${userId}`;
}

export function roomForWarehouse(warehouseId: string) {
  return `warehouse:${warehouseId}`;
}

export function roomForEntity(entityType: string, entityId: string) {
  return `${entityType.toLowerCase()}:${entityId}`;
}
