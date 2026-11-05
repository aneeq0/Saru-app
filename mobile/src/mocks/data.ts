/**
 * DEMO DATA for Saru International mobile mock API.
 * Clearly fictional. Password for all demo users: Demo@1234
 */
import { getPermissionsForRole } from '@/lib/permissions'
import type { AuthUser, SessionInfo } from '@/types/auth'
import type { SystemRole } from '@/types/permissions'
import type {
  ApprovalRequest,
  AppNotification,
  Contract,
  DashboardPayload,
  Delivery,
  DocumentRecord,
  ImportShipment,
  Invoice,
  Payment,
  Product,
  SecurityInstrument,
  StockBalance,
  TaskItem,
  Tender,
  Warehouse,
} from '@/types/entities'

export const DEMO_PASSWORD = 'Demo@1234'

export const DEMO_ORG: SessionInfo['organization'] = {
  id: 'org-saru-demo-001',
  name: 'Saru International (Demonstration)',
  shortName: 'Saru Demo',
}

function iso(dayOffset: number): string {
  return new Date(Date.UTC(2025, 9, 1 + dayOffset, 9, 0, 0)).toISOString()
}

function user(
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  role: SystemRole,
): AuthUser {
  return {
    id,
    email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    role,
    roleLabel: role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    status: 'active',
    permissions: getPermissionsForRole(role),
    department: 'Operations',
    lastLoginAt: iso(20),
  }
}

export const demoUsers: Array<{ password: string; user: AuthUser }> = [
  { password: DEMO_PASSWORD, user: user('usr-001', 'owner@saru.demo', 'Ayesha', 'Khan', 'owner') },
  {
    password: DEMO_PASSWORD,
    user: user('usr-002', 'tender@saru.demo', 'Bilal', 'Ahmed', 'tender_manager'),
  },
  {
    password: DEMO_PASSWORD,
    user: user('usr-003', 'import@saru.demo', 'Sara', 'Malik', 'import_manager'),
  },
  {
    password: DEMO_PASSWORD,
    user: user('usr-004', 'inventory@saru.demo', 'Hassan', 'Raza', 'inventory_manager'),
  },
  {
    password: DEMO_PASSWORD,
    user: user('usr-005', 'docs@saru.demo', 'Nadia', 'Iqbal', 'documentation_officer'),
  },
  {
    password: DEMO_PASSWORD,
    user: user('usr-006', 'accounts@saru.demo', 'Omar', 'Siddiqui', 'accounts_officer'),
  },
  {
    password: DEMO_PASSWORD,
    user: user('usr-007', 'auditor@saru.demo', 'Farah', 'Noor', 'auditor'),
  },
]

export const products: Product[] = [
  {
    id: 'prd-001',
    sku: 'SI-GLV-NIT-M',
    name: 'Nitrile Examination Gloves (M)',
    categoryName: 'PPE',
    manufacturerName: 'MediSafe GmbH',
    brand: 'MediSafe',
    packagingUnit: 'Box',
    variantCount: 3,
    stockAvailable: 4200,
    status: 'active',
    barcode: '8901001001001',
    description: 'Powder-free nitrile exam gloves, medium.',
    createdAt: iso(1),
    updatedAt: iso(18),
  },
  {
    id: 'prd-002',
    sku: 'SI-SYR-5ML',
    name: 'Disposable Syringe 5ml',
    categoryName: 'Consumables',
    manufacturerName: 'CareInject Ltd',
    packagingUnit: 'Box',
    variantCount: 2,
    stockAvailable: 1800,
    status: 'active',
    barcode: '8901001001002',
    createdAt: iso(2),
    updatedAt: iso(17),
  },
  {
    id: 'prd-003',
    sku: 'SI-MSK-N95',
    name: 'N95 Respirator Mask',
    categoryName: 'PPE',
    manufacturerName: 'AirShield Co',
    packagingUnit: 'Box',
    variantCount: 1,
    stockAvailable: 960,
    status: 'active',
    barcode: '8901001001003',
    createdAt: iso(3),
    updatedAt: iso(16),
  },
  {
    id: 'prd-004',
    sku: 'SI-IVC-20G',
    name: 'IV Cannula 20G',
    categoryName: 'Consumables',
    manufacturerName: 'VeinCare AG',
    packagingUnit: 'Box',
    variantCount: 4,
    stockAvailable: 640,
    status: 'active',
    barcode: '8901001001004',
    createdAt: iso(4),
    updatedAt: iso(15),
  },
  {
    id: 'prd-005',
    sku: 'SI-CAT-FOL-16',
    name: 'Foley Catheter 16Fr',
    categoryName: 'Urology',
    manufacturerName: 'UroMed Inc',
    packagingUnit: 'Piece',
    variantCount: 2,
    stockAvailable: 220,
    status: 'active',
    barcode: '8901001001005',
    createdAt: iso(5),
    updatedAt: iso(14),
  },
]

export const warehouses: Warehouse[] = [
  { id: 'wh-001', code: 'KHI-01', name: 'Karachi Central Warehouse', city: 'Karachi', status: 'active' },
  { id: 'wh-002', code: 'LHR-01', name: 'Lahore Distribution Hub', city: 'Lahore', status: 'active' },
  { id: 'wh-003', code: 'ISB-01', name: 'Islamabad Staging', city: 'Islamabad', status: 'active' },
]

export const stock: StockBalance[] = [
  {
    id: 'stk-001',
    sku: 'SI-GLV-NIT-M',
    productName: 'Nitrile Examination Gloves (M)',
    variantName: 'Medium / Blue',
    warehouseId: 'wh-001',
    warehouseName: 'Karachi Central Warehouse',
    location: 'A-12-04',
    batch: 'B-2508-01',
    expiryDate: '2027-08-01',
    onHand: 4200,
    reserved: 800,
    available: 3400,
    quarantined: 0,
    damaged: 0,
    expired: 0,
    unit: 'Box',
  },
  {
    id: 'stk-002',
    sku: 'SI-SYR-5ML',
    productName: 'Disposable Syringe 5ml',
    variantName: '5ml Luer Lock',
    warehouseId: 'wh-001',
    warehouseName: 'Karachi Central Warehouse',
    location: 'B-03-01',
    batch: 'B-2506-12',
    expiryDate: '2027-06-15',
    onHand: 1800,
    reserved: 300,
    available: 1500,
    quarantined: 20,
    damaged: 0,
    expired: 0,
    unit: 'Box',
  },
  {
    id: 'stk-003',
    sku: 'SI-MSK-N95',
    productName: 'N95 Respirator Mask',
    variantName: 'Standard',
    warehouseId: 'wh-002',
    warehouseName: 'Lahore Distribution Hub',
    location: 'C-01-02',
    batch: 'B-2504-03',
    expiryDate: '2026-12-01',
    onHand: 960,
    reserved: 160,
    available: 800,
    quarantined: 0,
    damaged: 12,
    expired: 0,
    unit: 'Box',
  },
]

export const imports: ImportShipment[] = [
  {
    id: 'imp-001',
    reference: 'IMP-2025-0142',
    supplierName: 'MediSafe GmbH',
    expectedArrival: iso(22),
    status: 'in_transit',
    itemCount: 4,
    totalValue: 185000,
    currency: 'USD',
    createdAt: iso(10),
    updatedAt: iso(18),
  },
  {
    id: 'imp-002',
    reference: 'IMP-2025-0138',
    supplierName: 'CareInject Ltd',
    expectedArrival: iso(12),
    actualArrival: iso(13),
    status: 'partially_received',
    itemCount: 3,
    totalValue: 42000,
    currency: 'EUR',
    createdAt: iso(5),
    updatedAt: iso(14),
  },
]

export const tenders: Tender[] = [
  {
    id: 'tnd-001',
    tenderNumber: 'PPRA-2025-8841',
    title: 'Supply of Examination Gloves — Punjab Health',
    departmentName: 'Punjab Health Department',
    submissionDeadline: iso(28),
    stage: 'preparing',
    estimatedValue: 12500000,
    currency: 'PKR',
    missingDocuments: 2,
    assignedManager: 'Bilal Ahmed',
    createdAt: iso(8),
    updatedAt: iso(19),
  },
  {
    id: 'tnd-002',
    tenderNumber: 'PPRA-2025-8710',
    title: 'Syringes and Cannulas Framework Agreement',
    departmentName: 'Federal Government Hospital',
    submissionDeadline: iso(16),
    stage: 'submitted',
    estimatedValue: 8900000,
    currency: 'PKR',
    missingDocuments: 0,
    assignedManager: 'Bilal Ahmed',
    createdAt: iso(2),
    updatedAt: iso(15),
  },
  {
    id: 'tnd-003',
    tenderNumber: 'PPRA-2025-8602',
    title: 'N95 Masks Emergency Procurement',
    departmentName: 'Ministry of NHSR&C',
    submissionDeadline: iso(5),
    stage: 'awarded',
    estimatedValue: 5600000,
    currency: 'PKR',
    missingDocuments: 0,
    createdAt: iso(1),
    updatedAt: iso(12),
  },
]

export const contracts: Contract[] = [
  {
    id: 'ctr-001',
    contractNumber: 'CTR-2025-0118',
    tenderNumber: 'PPRA-2025-8602',
    departmentName: 'Ministry of NHSR&C',
    awardedValue: 5400000,
    fulfilledValue: 2100000,
    currency: 'PKR',
    status: 'active',
    createdAt: iso(12),
    updatedAt: iso(19),
  },
]

export const securities: SecurityInstrument[] = [
  {
    id: 'cdr-001',
    type: 'CDR',
    reference: 'CDR-HBL-992134',
    issuingBank: 'Habib Bank Limited',
    amount: 250000,
    currency: 'PKR',
    expiryDate: iso(40),
    beneficiary: 'Punjab Health Department',
    linkedTenderNumber: 'PPRA-2025-8841',
    status: 'active',
    createdAt: iso(9),
    updatedAt: iso(9),
  },
]

export const deliveries: Delivery[] = [
  {
    id: 'dlv-001',
    deliveryNumber: 'DLV-2025-0451',
    contractNumber: 'CTR-2025-0118',
    departmentName: 'Ministry of NHSR&C',
    destination: 'PIMS Store, Islamabad',
    scheduledDate: iso(21),
    status: 'scheduled',
    itemCount: 6,
    assignedStaff: 'Hassan Raza',
    createdAt: iso(17),
    updatedAt: iso(17),
  },
  {
    id: 'dlv-002',
    deliveryNumber: 'DLV-2025-0440',
    contractNumber: 'CTR-2025-0118',
    departmentName: 'Ministry of NHSR&C',
    destination: 'FG Polyclinic, Islamabad',
    scheduledDate: iso(14),
    status: 'dispatched',
    itemCount: 4,
    assignedStaff: 'Hassan Raza',
    createdAt: iso(11),
    updatedAt: iso(14),
  },
]

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2025-0788',
    departmentName: 'Ministry of NHSR&C',
    invoiceDate: iso(15),
    dueDate: iso(45),
    grandTotal: 2100000,
    amountPaid: 0,
    balanceDue: 2100000,
    currency: 'PKR',
    status: 'issued',
    createdAt: iso(15),
    updatedAt: iso(15),
  },
]

export const payments: Payment[] = [
  {
    id: 'pay-001',
    paymentReference: 'PAY-2025-0201',
    payer: 'Federal Government Hospital',
    paymentDate: iso(10),
    amount: 950000,
    currency: 'PKR',
    method: 'Bank Transfer',
    status: 'allocated',
    createdAt: iso(10),
    updatedAt: iso(10),
  },
]

export const documents: DocumentRecord[] = [
  {
    id: 'doc-001',
    name: 'Nitrile Gloves Product Registration',
    category: 'Product Certificate',
    relatedReference: 'SI-GLV-NIT-M',
    expiryDate: iso(90),
    status: 'valid',
    uploadedBy: 'Nadia Iqbal',
    createdAt: iso(3),
    updatedAt: iso(3),
  },
  {
    id: 'doc-002',
    name: 'CDR Evidence — HBL 992134',
    category: 'Security Instrument',
    relatedReference: 'CDR-HBL-992134',
    expiryDate: iso(40),
    status: 'expiring',
    uploadedBy: 'Bilal Ahmed',
    createdAt: iso(9),
    updatedAt: iso(9),
  },
]

export const approvals: ApprovalRequest[] = [
  {
    id: 'apr-001',
    requestType: 'Stock Adjustment',
    recordReference: 'ADJ-2025-033',
    module: 'inventory',
    requester: 'Hassan Raza',
    assignedApprover: 'Ayesha Khan',
    requestedAt: iso(19),
    deadline: iso(22),
    status: 'pending',
    reason: 'Damaged carton during transfer',
    createdAt: iso(19),
    updatedAt: iso(19),
  },
  {
    id: 'apr-002',
    requestType: 'Invoice Finalization',
    recordReference: 'INV-2025-0788',
    module: 'invoices',
    requester: 'Omar Siddiqui',
    assignedApprover: 'Ayesha Khan',
    requestedAt: iso(18),
    status: 'pending',
    createdAt: iso(18),
    updatedAt: iso(18),
  },
]

export const notifications: AppNotification[] = [
  {
    id: 'ntf-001',
    category: 'tender_deadline',
    title: 'Tender deadline approaching',
    body: 'PPRA-2025-8841 submission is due soon.',
    priority: 'high',
    read: false,
    relatedType: 'tender',
    relatedId: 'tnd-001',
    createdAt: iso(19),
  },
  {
    id: 'ntf-002',
    category: 'approval_required',
    title: 'Approval required',
    body: 'Stock adjustment ADJ-2025-033 awaits your review.',
    priority: 'normal',
    read: false,
    relatedType: 'approval',
    relatedId: 'apr-001',
    createdAt: iso(19),
  },
  {
    id: 'ntf-003',
    category: 'shipment_delay',
    title: 'Shipment in transit',
    body: 'IMP-2025-0142 is expected to arrive shortly.',
    priority: 'normal',
    read: true,
    relatedType: 'import',
    relatedId: 'imp-001',
    createdAt: iso(18),
  },
]

export const tasks: TaskItem[] = [
  {
    id: 'tsk-001',
    title: 'Complete tender document checklist',
    module: 'tenders',
    dueDate: iso(24),
    priority: 'high',
    status: 'open',
    relatedReference: 'PPRA-2025-8841',
  },
  {
    id: 'tsk-002',
    title: 'Receive partial shipment IMP-2025-0138',
    module: 'imports',
    dueDate: iso(20),
    priority: 'normal',
    status: 'in_progress',
    relatedReference: 'IMP-2025-0138',
  },
  {
    id: 'tsk-003',
    title: 'Dispatch DLV-2025-0451 to PIMS',
    module: 'deliveries',
    dueDate: iso(21),
    priority: 'high',
    status: 'open',
    relatedReference: 'DLV-2025-0451',
  },
]

export function createSession(authUser: AuthUser): SessionInfo {
  return {
    user: { ...authUser, lastLoginAt: new Date().toISOString() },
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    accessToken: `demo-token-${authUser.id}`,
    organization: DEMO_ORG,
  }
}

export function buildDashboard(role: SystemRole): DashboardPayload {
  const base: DashboardPayload = {
    role,
    kpis: [
      { id: 'k1', label: 'Active tenders', value: 2, formattedValue: '2', hint: 'In progress' },
      { id: 'k2', label: 'Pending approvals', value: 2, formattedValue: '2' },
      { id: 'k3', label: 'Shipments in transit', value: 1, formattedValue: '1' },
      { id: 'k4', label: 'Deliveries pending', value: 1, formattedValue: '1' },
    ],
    upcomingDeadlines: tenders
      .filter((t) => t.stage === 'preparing' || t.stage === 'submitted')
      .map((t) => ({
        id: t.id,
        title: t.title,
        reference: t.tenderNumber,
        dueDate: t.submissionDeadline,
        type: 'Tender',
      })),
    pendingApprovals: approvals
      .filter((a) => a.status === 'pending')
      .map((a) => ({
        id: a.id,
        title: a.requestType,
        reference: a.recordReference,
        dueDate: a.deadline ?? a.requestedAt,
        type: 'Approval',
      })),
    attentionItems: [
      {
        id: 'att-1',
        title: 'Missing tender documents',
        reference: 'PPRA-2025-8841',
        dueDate: iso(24),
        type: 'Documents',
      },
      {
        id: 'att-2',
        title: 'CDR expiring',
        reference: 'CDR-HBL-992134',
        dueDate: iso(40),
        type: 'Security',
      },
    ],
  }

  if (role === 'inventory_manager') {
    base.kpis = [
      { id: 'k1', label: 'Pending receipts', value: 1, formattedValue: '1' },
      { id: 'k2', label: 'Quarantined lots', value: 1, formattedValue: '1' },
      { id: 'k3', label: 'Pending dispatches', value: 1, formattedValue: '1' },
      { id: 'k4', label: 'Low stock SKUs', value: 1, formattedValue: '1' },
    ]
  }
  if (role === 'accounts_officer') {
    base.kpis = [
      { id: 'k1', label: 'Outstanding invoices', value: 1, formattedValue: '1' },
      { id: 'k2', label: 'Balance due', value: 2100000, formattedValue: 'PKR 2.10M' },
      { id: 'k3', label: 'Pending approvals', value: 1, formattedValue: '1' },
      { id: 'k4', label: 'Recent payments', value: 1, formattedValue: '1' },
    ]
  }
  return base
}
