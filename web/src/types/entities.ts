import type { AuditMeta, EntityStatus } from './api'

export interface Product extends AuditMeta {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  categoryName: string
  manufacturerId: string
  manufacturerName: string
  brand?: string
  countryOfOrigin?: string
  packagingUnit: string
  variantCount: number
  stockAvailable: number
  status: EntityStatus
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  name: string
  size?: string
  dimensions?: string
  material?: string
  grade?: string
  model?: string
  packaging?: string
  purchaseUnit: string
  sellingUnit: string
  conversionFactor: number
  status: EntityStatus
}

export interface Supplier extends AuditMeta {
  id: string
  code: string
  name: string
  country: string
  contactName?: string
  email?: string
  phone?: string
  status: EntityStatus
  onTimeDeliveryRate?: number
  discrepancyRate?: number
  rejectedQuantityRate?: number
}

export interface Manufacturer extends AuditMeta {
  id: string
  code: string
  name: string
  country: string
  status: EntityStatus
}

export interface Department extends AuditMeta {
  id: string
  code: string
  name: string
  type: 'ministry' | 'hospital' | 'agency' | 'other'
  city?: string
  province?: string
  contactName?: string
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
  supplierId: string
  supplierName: string
  manufacturerName?: string
  supplierOrderRef?: string
  shippingMethod: string
  expectedArrival?: string
  actualArrival?: string
  currency: string
  exchangeRate: number
  status: ShipmentStatus
  itemCount: number
  totalValue: number
}

export interface Warehouse {
  id: string
  code: string
  name: string
  city: string
  status: EntityStatus
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
  departmentId: string
  departmentName: string
  procurementAuthority?: string
  sourcePortal?: string
  submissionDeadline: string
  openingDate?: string
  assignedManager?: string
  stage: TenderStage
  estimatedValue?: number
  currency: string
  missingDocuments?: number
}

export interface Contract extends AuditMeta {
  id: string
  contractNumber: string
  tenderId: string
  tenderNumber: string
  departmentName: string
  awardedValue: number
  fulfilledValue: number
  currency: string
  startDate: string
  endDate?: string
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
  type: 'CDR' | 'Bank Guarantee' | 'Pay Order' | 'Other'
  reference: string
  issuingBank: string
  amount: number
  currency: string
  issueDate: string
  expiryDate: string
  beneficiary: string
  linkedTenderNumber?: string
  linkedContractNumber?: string
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
  dispatchDate?: string
  status: DeliveryStatus
  itemCount: number
  challanNumber?: string
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
  contractNumber?: string
  departmentName: string
  invoiceDate: string
  dueDate?: string
  subtotal: number
  taxTotal: number
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
  bankReference?: string
  allocatedAmount: number
  status: 'recorded' | 'allocated' | 'reversed'
}

export interface DocumentRecord extends AuditMeta {
  id: string
  name: string
  category: string
  relatedType?: string
  relatedReference?: string
  issueDate?: string
  expiryDate?: string
  status: 'valid' | 'expiring' | 'expired' | 'pending_review' | 'rejected'
  uploadedBy: string
  fileSize: number
  mimeType: string
}

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'cancelled'
  | 'escalated'

export interface ApprovalRequest extends AuditMeta {
  id: string
  requestType: string
  recordReference: string
  module: string
  requester: string
  assignedApprover: string
  requestedAt: string
  deadline?: string
  level: number
  reason?: string
  status: ApprovalStatus
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

export interface AuditLogEntry {
  id: string
  user: string
  action: string
  module: string
  recordReference?: string
  timestamp: string
  result: 'success' | 'failure'
  details?: string
}

export interface Employee extends AuditMeta {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  role: string
  department?: string
  status: 'active' | 'inactive' | 'locked'
  lastLoginAt?: string
}

export interface ReportCatalogItem {
  id: string
  name: string
  description: string
  module: string
  formats: readonly ('pdf' | 'xlsx' | 'csv')[]
}

export interface ReceivableLine {
  id: string
  invoiceNumber: string
  departmentName: string
  dueDate?: string
  balanceDue: number
  currency: string
  status: InvoiceStatus
  daysOverdue?: number
}

export interface StockMovement {
  id: string
  sku: string
  productName: string
  warehouseName: string
  movementType: string
  quantity: number
  unit: string
  reference?: string
  occurredAt: string
}

export interface CompanySettings {
  organization: { id: string; name: string; shortName: string }
  legalName: string
  taxRegistration: string
  defaultCurrency: string
  fiscalYearStartMonth: number
  timezone: string
  supportEmail: string
  updatedAt: string
}

export interface HealthServiceStatus {
  name: string
  status: 'up' | 'degraded' | 'down'
  latencyMs?: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checkedAt: string
  services: HealthServiceStatus[]
  version: string
}


export interface Category extends AuditMeta {
  id: string
  code: string
  name: string
  parentName?: string
  productCount: number
  status: EntityStatus
}

export interface GoodsReceiptRecord extends AuditMeta {
  id: string
  reference: string
  shipmentReference: string
  warehouseName: string
  receivedQty: number
  acceptedQty: number
  status: 'draft' | 'submitted' | 'approved' | 'posted' | 'rejected'
  receivedAt?: string
}

export interface StockReservationRecord extends AuditMeta {
  id: string
  sku: string
  productName: string
  warehouseName: string
  quantity: number
  sourceType: string
  sourceReference: string
  status: 'active' | 'released' | 'consumed' | 'expired'
  expiresAt?: string
}

export interface StockCountRecord extends AuditMeta {
  id: string
  reference: string
  warehouseName: string
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'posted'
  lineCount: number
  varianceCount: number
  countedAt?: string
}

export interface StockTransferRecord extends AuditMeta {
  id: string
  reference: string
  fromWarehouse: string
  toWarehouse: string
  status: 'draft' | 'in_transit' | 'received' | 'cancelled'
  lineCount: number
  shippedAt?: string
}

export interface QualityInspectionRecord extends AuditMeta {
  id: string
  reference: string
  sku: string
  productName: string
  warehouseName: string
  status: 'pending' | 'passed' | 'failed' | 'quarantined' | 'released'
  acceptedQty: number
  rejectedQty: number
  inspectedAt?: string
}

export interface BidRecord extends AuditMeta {
  id: string
  reference: string
  tenderNumber: string
  tenderTitle: string
  status: 'draft' | 'submitted' | 'under_evaluation' | 'won' | 'lost'
  totalAmount: number
  currency: string
  submittedAt?: string
}

export interface ComplianceItem extends AuditMeta {
  id: string
  tenderNumber: string
  code: string
  title: string
  required: boolean
  completed: boolean
  dueDate?: string
  status: 'open' | 'complete' | 'overdue'
}

export interface ChallanRecord extends AuditMeta {
  id: string
  challanNumber: string
  deliveryNumber: string
  departmentName: string
  status: 'draft' | 'issued' | 'dispatched' | 'cancelled'
  itemCount: number
  issuedAt?: string
}

export interface AnalyticsSummaryRow {
  id: string
  metric: string
  period: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'flat'
  note?: string
}

export interface DocumentTemplateRecord extends AuditMeta {
  id: string
  code: string
  name: string
  documentType: string
  versionLabel: string
  status: EntityStatus
}

export interface NotificationConfigRecord extends AuditMeta {
  id: string
  eventType: string
  channel: 'in_app' | 'email' | 'push'
  enabled: boolean
  audience: string
}

export interface IntegrationConnection extends AuditMeta {
  id: string
  name: string
  provider: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSyncAt?: string
  notes?: string
}

export interface RoleRecord {
  id: string
  code: string
  name: string
  description: string
  userCount: number
  permissionCount: number
  isSystem: boolean
}
