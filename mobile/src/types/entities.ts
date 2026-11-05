import type { AuditMeta, EntityStatus } from './api'

export interface Product extends AuditMeta {
  id: string
  sku: string
  name: string
  description?: string
  categoryName: string
  manufacturerName: string
  brand?: string
  packagingUnit: string
  variantCount: number
  stockAvailable: number
  status: EntityStatus
  barcode?: string
}

export interface StockBalance {
  id: string
  sku: string
  productName: string
  variantName: string
  warehouseId: string
  warehouseName: string
  location?: string
  batch?: string
  expiryDate?: string
  onHand: number
  reserved: number
  available: number
  quarantined: number
  damaged: number
  expired: number
  unit: string
}

export interface Warehouse {
  id: string
  code: string
  name: string
  city: string
  status: EntityStatus
}

export type ShipmentStatus =
  | 'draft'
  | 'ordered'
  | 'in_transit'
  | 'arrived'
  | 'partially_received'
  | 'received'
  | 'discrepancy'
  | 'closed'
  | 'cancelled'

export interface ImportShipment extends AuditMeta {
  id: string
  reference: string
  supplierName: string
  expectedArrival?: string
  actualArrival?: string
  status: ShipmentStatus
  itemCount: number
  totalValue: number
  currency: string
}

export type TenderStage =
  | 'identified'
  | 'under_review'
  | 'preparing'
  | 'submitted'
  | 'awarded'
  | 'partially_awarded'
  | 'rejected'
  | 'cancelled'
  | 'closed'

export interface Tender extends AuditMeta {
  id: string
  tenderNumber: string
  title: string
  departmentName: string
  submissionDeadline: string
  stage: TenderStage
  estimatedValue?: number
  currency: string
  missingDocuments?: number
  assignedManager?: string
}

export interface Contract extends AuditMeta {
  id: string
  contractNumber: string
  tenderNumber: string
  departmentName: string
  awardedValue: number
  fulfilledValue: number
  currency: string
  status: 'active' | 'completed' | 'amended' | 'cancelled' | 'closed'
}

export type SecurityStatus =
  | 'prepared'
  | 'submitted'
  | 'active'
  | 'release_requested'
  | 'released'
  | 'expired'
  | 'encashed'

export interface SecurityInstrument extends AuditMeta {
  id: string
  type: string
  reference: string
  issuingBank: string
  amount: number
  currency: string
  expiryDate: string
  beneficiary: string
  linkedTenderNumber?: string
  status: SecurityStatus
}

export type DeliveryStatus =
  | 'scheduled'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'acknowledged'
  | 'partially_rejected'
  | 'returned'
  | 'cancelled'

export interface Delivery extends AuditMeta {
  id: string
  deliveryNumber: string
  contractNumber: string
  departmentName: string
  destination: string
  scheduledDate: string
  status: DeliveryStatus
  itemCount: number
  assignedStaff?: string
}

export type InvoiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'
  | 'amended'

export interface Invoice extends AuditMeta {
  id: string
  invoiceNumber: string
  departmentName: string
  invoiceDate: string
  dueDate?: string
  grandTotal: number
  amountPaid: number
  balanceDue: number
  currency: string
  status: InvoiceStatus
}

export interface Payment extends AuditMeta {
  id: string
  paymentReference: string
  payer: string
  paymentDate: string
  amount: number
  currency: string
  method: string
  status: 'recorded' | 'allocated' | 'reversed'
}

export interface DocumentRecord extends AuditMeta {
  id: string
  name: string
  category: string
  relatedReference?: string
  expiryDate?: string
  status: 'valid' | 'expiring' | 'expired' | 'pending_review' | 'rejected'
  uploadedBy: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'

export interface ApprovalRequest extends AuditMeta {
  id: string
  requestType: string
  recordReference: string
  module: string
  requester: string
  assignedApprover: string
  requestedAt: string
  deadline?: string
  status: ApprovalStatus
  reason?: string
}

export interface AppNotification {
  id: string
  category: string
  title: string
  body: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  read: boolean
  relatedType?: string
  relatedId?: string
  createdAt: string
}

export interface TaskItem {
  id: string
  title: string
  module: string
  dueDate?: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'done'
  relatedReference?: string
}

export interface DashboardKpi {
  id: string
  label: string
  value: number
  formattedValue: string
  hint?: string
}

export interface DashboardPayload {
  role: string
  kpis: DashboardKpi[]
  upcomingDeadlines: Array<{
    id: string
    title: string
    reference: string
    dueDate: string
    type: string
  }>
  pendingApprovals: Array<{
    id: string
    title: string
    reference: string
    dueDate: string
    type: string
  }>
  attentionItems: Array<{
    id: string
    title: string
    reference: string
    dueDate: string
    type: string
  }>
}
