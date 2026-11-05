import { http, HttpResponse } from 'msw'
import { DEMO_ORGANIZATION, store } from '@/mocks/data/store'
import { getMockSession } from '@/mocks/session'
import { delay, paginate, parseListQuery } from '@/mocks/utils/pagination'
import type { ApiErrorBody, AuditMeta } from '@/types/api'
import type { ApprovalRequest, Delivery, Invoice, StockBalance, Tender } from '@/types/entities'
import type { SessionInfo } from '@/types/auth'

const API = '*/api'

function error(status: number, message: string, code?: string): HttpResponse<ApiErrorBody> {
  return HttpResponse.json(
    {
      statusCode: status,
      message,
      error: status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Error',
      code,
    },
    { status },
  )
}

function requireSession(): SessionInfo | HttpResponse<ApiErrorBody> {
  const session = getMockSession()
  if (!session) return error(401, 'No active session')
  return session
}

function listHandler<T extends object>(
  getItems: () => T[],
  searchFields: (keyof T & string)[],
) {
  return async ({ request }: { request: Request }) => {
    await delay()
    const url = new URL(request.url)
    const query = parseListQuery(url)
    if (url.searchParams.get('status') && !query.filters?.status) {
      query.filters = { ...query.filters, status: url.searchParams.get('status')! }
    }
    if (url.searchParams.get('stage') && !query.filters?.stage) {
      query.filters = { ...query.filters, stage: url.searchParams.get('stage')! }
    }
    return HttpResponse.json(paginate(getItems(), { ...query, searchFields }))
  }
}

function detailHandler<T extends { id: string }>(getItems: () => T[]) {
  return async ({ params }: { params: Record<string, string | readonly string[] | undefined> }) => {
    await delay()
    const id = String(params.id ?? '')
    const item = getItems().find((row) => row.id === id)
    if (!item) return error(404, `Record ${id} not found`)
    return HttpResponse.json(item)
  }
}

function nextId(prefix: string, existing: { id: string }[]): string {
  const nums = existing
    .map((e) => {
      const match = e.id.match(/-(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function touchAudit<T extends AuditMeta>(entity: T, userId?: string, bumpVersion = true): T {
  const version = bumpVersion ? (entity.version ?? 1) + 1 : entity.version ?? 1
  return {
    ...entity,
    updatedAt: new Date().toISOString(),
    updatedBy: userId ?? entity.updatedBy,
    version,
  }
}

function createHandler<T extends { id: string } & AuditMeta>(
  collection: () => T[],
  prefix: string,
  mapBody: (body: Record<string, unknown>, id: string, meta: AuditMeta) => T,
) {
  return async ({ request }: { request: Request }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const items = collection()
    const id = nextId(prefix, items)
    const meta: AuditMeta = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: session.user.id,
      updatedBy: session.user.id,
      version: 1,
    }
    const created = mapBody(body, id, meta)
    items.push(created)
    return HttpResponse.json(created, { status: 201 })
  }
}

function patchHandler<T extends { id: string } & AuditMeta>(collection: () => T[]) {
  return async ({
    request,
    params,
  }: {
    request: Request
    params: Record<string, string | readonly string[] | undefined>
  }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    const id = String(params.id ?? '')
    const items = collection()
    const index = items.findIndex((x) => x.id === id)
    if (index < 0) return error(404, `Record ${id} not found`)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const current = items[index]
    const headerVersion = request.headers.get('If-Match')
    const expectedVersion =
      body.version ?? (headerVersion ? Number(headerVersion.replace(/"/g, '')) : undefined)
    if (expectedVersion != null && current.version != null && expectedVersion !== current.version) {
      return error(409, 'Version conflict — refresh and retry', 'VERSION_CONFLICT')
    }
    const { version: _v, ...rest } = body
    void _v
    const updated = touchAudit({ ...current, ...rest, id: current.id } as T, session.user.id)
    items[index] = updated
    return HttpResponse.json(updated)
  }
}

type SearchHit = {
  id: string
  type: string
  title: string
  subtitle?: string
  reference?: string
}

function collectSearchHits(q: string): SearchHit[] {
  const needle = q.toLowerCase()
  const hits: SearchHit[] = []
  const push = (type: string, id: string, title: string, subtitle?: string, reference?: string) => {
    const blob = `${title} ${subtitle ?? ''} ${reference ?? ''} ${id}`.toLowerCase()
    if (blob.includes(needle)) hits.push({ id, type, title, subtitle, reference })
  }
  store.products.forEach((p) => push('product', p.id, p.name, p.sku, p.sku))
  store.suppliers.forEach((s) => push('supplier', s.id, s.name, s.code, s.code))
  store.tenders.forEach((t) => push('tender', t.id, t.title, t.tenderNumber, t.tenderNumber))
  store.contracts.forEach((c) =>
    push('contract', c.id, c.contractNumber, c.departmentName, c.contractNumber),
  )
  store.invoices.forEach((i) =>
    push('invoice', i.id, i.invoiceNumber, i.departmentName, i.invoiceNumber),
  )
  store.imports.forEach((i) => push('import', i.id, i.reference, i.supplierName, i.reference))
  store.deliveries.forEach((d) =>
    push('delivery', d.id, d.deliveryNumber, d.destination, d.deliveryNumber),
  )
  store.documents.forEach((d) => push('document', d.id, d.name, d.category, d.relatedReference))
  return hits.slice(0, 50)
}

function buildMovements() {
  return store.stock.map((row: StockBalance, index) => ({
    id: `mov-${String(index + 1).padStart(4, '0')}`,
    sku: row.sku,
    productName: row.productName,
    warehouseName: row.warehouseName,
    movementType: index % 3 === 0 ? 'receipt' : index % 3 === 1 ? 'issue' : 'adjustment',
    quantity: index % 3 === 1 ? -Math.min(5, row.onHand) : Math.min(10, row.available),
    unit: row.unit,
    reference: index % 3 === 0 ? `GRN-DEMO-${index}` : `TX-DEMO-${index}`,
    occurredAt: row.expiryDate ?? store.imports[0]?.updatedAt ?? new Date().toISOString(),
  }))
}

function mutateApproval(id: string, status: ApprovalRequest['status'], userId: string) {
  const index = store.approvals.findIndex((a) => a.id === id)
  if (index < 0) return error(404, `Approval ${id} not found`)
  const updated: ApprovalRequest = touchAudit({ ...store.approvals[index], status }, userId)
  store.approvals[index] = updated
  return HttpResponse.json(updated)
}

export const resourceHandlers = [
  http.get(`${API}/search`, async ({ request }) => {
    await delay()
    const q = new URL(request.url).searchParams.get('q') ?? ''
    if (!q.trim()) {
      return HttpResponse.json({ query: q, results: [] as SearchHit[], isDemo: true })
    }
    return HttpResponse.json({ query: q, results: collectSearchHits(q), isDemo: true })
  }),

  http.get(`${API}/products`, listHandler(() => store.products, ['sku', 'name', 'categoryName', 'manufacturerName'])),
  http.get(`${API}/products/:id`, detailHandler(() => store.products)),
  http.post(
    `${API}/products`,
    createHandler(() => store.products, 'prd', (body, id, meta) => ({
      id,
      sku: String(body.sku ?? `DEMO-SKU-${id}`),
      name: String(body.name ?? 'New Demo Product'),
      description: body.description as string | undefined,
      categoryId: String(body.categoryId ?? 'cat-demo'),
      categoryName: String(body.categoryName ?? 'Uncategorized'),
      manufacturerId: String(body.manufacturerId ?? 'mfr-001'),
      manufacturerName: String(body.manufacturerName ?? 'Saru Pharma GmbH'),
      packagingUnit: String(body.packagingUnit ?? 'Unit'),
      variantCount: Number(body.variantCount ?? 0),
      stockAvailable: Number(body.stockAvailable ?? 0),
      status: (body.status as 'active') ?? 'draft',
      ...meta,
    })),
  ),
  http.patch(`${API}/products/:id`, patchHandler(() => store.products)),

  http.get(`${API}/suppliers`, listHandler(() => store.suppliers, ['code', 'name', 'country', 'email'])),
  http.get(`${API}/suppliers/:id`, detailHandler(() => store.suppliers)),
  http.post(
    `${API}/suppliers`,
    createHandler(() => store.suppliers, 'sup', (body, id, meta) => ({
      id,
      code: String(body.code ?? id.toUpperCase()),
      name: String(body.name ?? 'Demo Supplier'),
      country: String(body.country ?? 'Pakistan'),
      contactName: body.contactName as string | undefined,
      email: body.email as string | undefined,
      phone: body.phone as string | undefined,
      status: (body.status as 'active') ?? 'active',
      ...meta,
    })),
  ),
  http.patch(`${API}/suppliers/:id`, patchHandler(() => store.suppliers)),

  http.get(`${API}/manufacturers`, listHandler(() => store.manufacturers, ['code', 'name', 'country'])),
  http.get(`${API}/manufacturers/:id`, detailHandler(() => store.manufacturers)),
  http.post(
    `${API}/manufacturers`,
    createHandler(() => store.manufacturers, 'mfr', (body, id, meta) => ({
      id,
      code: String(body.code ?? id.slice(-3).toUpperCase()),
      name: String(body.name ?? 'Demo Manufacturer'),
      country: String(body.country ?? 'Pakistan'),
      status: (body.status as 'active') ?? 'active',
      ...meta,
    })),
  ),
  http.patch(`${API}/manufacturers/:id`, patchHandler(() => store.manufacturers)),

  http.get(`${API}/departments`, listHandler(() => store.departments, ['code', 'name', 'city'])),
  http.get(`${API}/departments/:id`, detailHandler(() => store.departments)),
  http.post(
    `${API}/departments`,
    createHandler(() => store.departments, 'dep', (body, id, meta) => ({
      id,
      code: String(body.code ?? id.toUpperCase()),
      name: String(body.name ?? 'Demo Department'),
      type: (body.type as 'other') ?? 'other',
      city: body.city as string | undefined,
      province: body.province as string | undefined,
      status: (body.status as 'active') ?? 'active',
      ...meta,
    })),
  ),
  http.patch(`${API}/departments/:id`, patchHandler(() => store.departments)),

  http.get(`${API}/imports`, listHandler(() => store.imports, ['reference', 'supplierName'])),
  http.get(`${API}/imports/:id`, detailHandler(() => store.imports)),
  http.post(
    `${API}/imports`,
    createHandler(() => store.imports, 'imp', (body, id, meta) => ({
      id,
      reference: String(body.reference ?? `IMP-DEMO-${id}`),
      supplierId: String(body.supplierId ?? 'sup-001'),
      supplierName: String(body.supplierName ?? 'Karachi Medical Imports'),
      shippingMethod: String(body.shippingMethod ?? 'Sea'),
      currency: 'PKR',
      exchangeRate: 1,
      status: (body.status as 'draft') ?? 'draft',
      itemCount: Number(body.itemCount ?? 0),
      totalValue: Number(body.totalValue ?? 0),
      ...meta,
    })),
  ),
  http.patch(`${API}/imports/:id`, patchHandler(() => store.imports)),

  http.get(`${API}/inventory/stock`, listHandler(() => store.stock, ['sku', 'productName', 'warehouseName'])),
  http.get(`${API}/inventory/stock/:id`, detailHandler(() => store.stock)),
  http.get(
    `${API}/inventory/warehouses`,
    listHandler(() => store.warehouses, ['code', 'name', 'city']),
  ),
  http.get(`${API}/inventory/warehouses/:id`, detailHandler(() => store.warehouses)),
  http.get(`${API}/inventory/movements`, listHandler(() => buildMovements(), ['sku', 'productName', 'reference'])),

  http.get(`${API}/tenders`, listHandler(() => store.tenders, ['tenderNumber', 'title', 'departmentName'])),
  http.get(
    `${API}/tenders/bids`,
    listHandler(() => store.bids, ['reference', 'tenderNumber', 'tenderTitle']),
  ),
  http.get(
    `${API}/tenders/compliance`,
    listHandler(() => store.complianceItems, ['tenderNumber', 'code', 'title']),
  ),
  http.get(`${API}/tenders/:id`, detailHandler(() => store.tenders)),
  http.post(`${API}/tenders`, async ({ request }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    const body = (await request.json()) as Partial<Tender>
    const id = nextId('tnd', store.tenders)
    const now = new Date().toISOString()
    const created: Tender = {
      id,
      tenderNumber: body.tenderNumber ?? `TND-DEMO-${id}`,
      title: body.title ?? 'Untitled tender (demo)',
      departmentId: body.departmentId ?? store.departments[0]?.id ?? 'dep-001',
      departmentName: body.departmentName ?? store.departments[0]?.name ?? 'Demo department',
      procurementAuthority: body.procurementAuthority,
      sourcePortal: body.sourcePortal,
      submissionDeadline: body.submissionDeadline ?? now,
      openingDate: body.openingDate,
      assignedManager: body.assignedManager,
      stage: body.stage ?? 'identified',
      estimatedValue: body.estimatedValue,
      currency: body.currency ?? 'PKR',
      missingDocuments: body.missingDocuments ?? 0,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      version: 1,
    }
    store.tenders.unshift(created)
    return HttpResponse.json(created, { status: 201 })
  }),
  http.patch(`${API}/tenders/:id`, patchHandler(() => store.tenders)),

  http.get(`${API}/contracts`, listHandler(() => store.contracts, ['contractNumber', 'tenderNumber', 'departmentName'])),
  http.get(`${API}/contracts/:id`, detailHandler(() => store.contracts)),
  http.post(
    `${API}/contracts`,
    createHandler(() => store.contracts, 'ctr', (body, id, meta) => ({
      id,
      contractNumber: String(body.contractNumber ?? `CTR-DEMO-${id}`),
      tenderId: String(body.tenderId ?? 'tnd-001'),
      tenderNumber: String(body.tenderNumber ?? 'TND-DEMO'),
      departmentName: String(body.departmentName ?? 'Demo Department'),
      awardedValue: Number(body.awardedValue ?? 0),
      fulfilledValue: Number(body.fulfilledValue ?? 0),
      currency: 'PKR',
      startDate: String(body.startDate ?? new Date().toISOString().slice(0, 10)),
      status: (body.status as 'active') ?? 'active',
      ...meta,
    })),
  ),
  http.patch(`${API}/contracts/:id`, patchHandler(() => store.contracts)),

  http.get(`${API}/securities`, listHandler(() => store.securities, ['reference', 'issuingBank', 'beneficiary'])),
  http.get(`${API}/securities/:id`, detailHandler(() => store.securities)),
  http.post(
    `${API}/securities`,
    createHandler(() => store.securities, 'sec', (body, id, meta) => ({
      id,
      type: (body.type as 'CDR') ?? 'CDR',
      reference: String(body.reference ?? `SEC-DEMO-${id}`),
      issuingBank: String(body.issuingBank ?? 'Demo Bank'),
      amount: Number(body.amount ?? 0),
      currency: 'PKR',
      issueDate: String(body.issueDate ?? new Date().toISOString().slice(0, 10)),
      expiryDate: String(body.expiryDate ?? new Date().toISOString().slice(0, 10)),
      beneficiary: String(body.beneficiary ?? 'Demo Beneficiary'),
      status: (body.status as 'prepared') ?? 'prepared',
      ...meta,
    })),
  ),
  http.patch(`${API}/securities/:id`, patchHandler(() => store.securities)),

  http.get(`${API}/deliveries`, listHandler(() => store.deliveries, ['deliveryNumber', 'contractNumber', 'destination'])),
  http.get(
    `${API}/deliveries/challans`,
    listHandler(() => store.challans, ['challanNumber', 'deliveryNumber', 'departmentName']),
  ),
  http.get(`${API}/deliveries/:id`, detailHandler(() => store.deliveries)),
  http.post(
    `${API}/deliveries`,
    createHandler(() => store.deliveries, 'del', (body, id, meta) => ({
      id,
      deliveryNumber: String(body.deliveryNumber ?? `DEL-DEMO-${id}`),
      contractNumber: String(body.contractNumber ?? 'CTR-DEMO'),
      departmentName: String(body.departmentName ?? 'Demo Department'),
      destination: String(body.destination ?? 'Demo Destination'),
      scheduledDate: String(body.scheduledDate ?? new Date().toISOString().slice(0, 10)),
      status: (body.status as 'scheduled') ?? 'scheduled',
      itemCount: Number(body.itemCount ?? 0),
      ...meta,
    })),
  ),
  http.patch(`${API}/deliveries/:id`, patchHandler(() => store.deliveries)),
  http.post(`${API}/deliveries/:id/confirm-dispatch`, async ({ request, params }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    const id = String(params.id ?? '')
    const index = store.deliveries.findIndex((d) => d.id === id)
    if (index < 0) return error(404, `Delivery ${id} not found`)
    const body = (await request.json().catch(() => ({}))) as { version?: number }
    const current = store.deliveries[index]
    const headerVersion = request.headers.get('If-Match')
    const expectedVersion =
      body.version ?? (headerVersion ? Number(headerVersion.replace(/"/g, '')) : undefined)
    if (expectedVersion != null && current.version != null && expectedVersion !== current.version) {
      return error(409, 'Version conflict — refresh and retry', 'VERSION_CONFLICT')
    }
    if (!['scheduled', 'preparing'].includes(current.status)) {
      return error(400, 'Delivery cannot be dispatched in current status')
    }
    const updated: Delivery = touchAudit(
      {
        ...current,
        status: 'dispatched',
        dispatchDate: new Date().toISOString().slice(0, 10),
      },
      session.user.id,
    )
    store.deliveries[index] = updated
    return HttpResponse.json(updated)
  }),

  http.get(`${API}/invoices`, listHandler(() => store.invoices, ['invoiceNumber', 'departmentName', 'contractNumber'])),
  http.get(`${API}/invoices/:id`, detailHandler(() => store.invoices)),
  http.post(
    `${API}/invoices`,
    createHandler(() => store.invoices, 'inv', (body, id, meta) => ({
      id,
      invoiceNumber: String(body.invoiceNumber ?? `INV-DEMO-${id}`),
      departmentName: String(body.departmentName ?? 'Demo Department'),
      invoiceDate: String(body.invoiceDate ?? new Date().toISOString().slice(0, 10)),
      subtotal: Number(body.subtotal ?? 0),
      taxTotal: Number(body.taxTotal ?? 0),
      grandTotal: Number(body.grandTotal ?? 0),
      amountPaid: 0,
      balanceDue: Number(body.grandTotal ?? 0),
      currency: 'PKR',
      status: (body.status as 'draft') ?? 'draft',
      contractNumber: body.contractNumber as string | undefined,
      ...meta,
    })),
  ),
  http.patch(`${API}/invoices/:id`, patchHandler(() => store.invoices)),
  http.post(`${API}/invoices/:id/finalize`, async ({ request, params }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    const id = String(params.id ?? '')
    const index = store.invoices.findIndex((i) => i.id === id)
    if (index < 0) return error(404, `Invoice ${id} not found`)
    const body = (await request.json().catch(() => ({}))) as { version?: number }
    const current = store.invoices[index]
    const headerVersion = request.headers.get('If-Match')
    const expectedVersion =
      body.version ?? (headerVersion ? Number(headerVersion.replace(/"/g, '')) : undefined)
    if (expectedVersion != null && current.version != null && expectedVersion !== current.version) {
      return error(409, 'Version conflict — refresh and retry', 'VERSION_CONFLICT')
    }
    if (!['draft', 'pending_approval'].includes(current.status)) {
      return error(400, 'Invoice cannot be finalized in current status')
    }
    const updated: Invoice = touchAudit({ ...current, status: 'issued' }, session.user.id)
    store.invoices[index] = updated
    return HttpResponse.json(updated)
  }),

  http.get(`${API}/payments`, listHandler(() => store.payments, ['paymentReference', 'payer'])),
  http.get(`${API}/payments/:id`, detailHandler(() => store.payments)),
  http.post(
    `${API}/payments`,
    createHandler(() => store.payments, 'pay', (body, id, meta) => ({
      id,
      paymentReference: String(body.paymentReference ?? `RCPT-DEMO-${id}`),
      payer: String(body.payer ?? 'Demo Payer'),
      paymentDate: String(body.paymentDate ?? new Date().toISOString().slice(0, 10)),
      amount: Number(body.amount ?? 0),
      currency: 'PKR',
      method: String(body.method ?? 'Bank Transfer'),
      allocatedAmount: Number(body.allocatedAmount ?? 0),
      status: (body.status as 'recorded') ?? 'recorded',
      ...meta,
    })),
  ),
  http.patch(`${API}/payments/:id`, patchHandler(() => store.payments)),

  http.get(`${API}/receivables`, async ({ request }) => {
    await delay()
    const url = new URL(request.url)
    const query = parseListQuery(url)
    const receivables = store.invoices
      .filter((inv) => inv.balanceDue > 0)
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        departmentName: inv.departmentName,
        dueDate: inv.dueDate,
        balanceDue: inv.balanceDue,
        currency: inv.currency,
        status: inv.status,
        daysOverdue:
          inv.dueDate && new Date(inv.dueDate) < new Date()
            ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86_400_000)
            : 0,
      }))
    return HttpResponse.json(
      paginate(receivables, {
        ...query,
        searchFields: ['invoiceNumber', 'departmentName'],
      }),
    )
  }),

  http.get(`${API}/documents`, listHandler(() => store.documents, ['name', 'category', 'relatedReference'])),
  http.get(
    `${API}/documents/templates`,
    listHandler(() => store.documentTemplates, ['code', 'name', 'documentType']),
  ),
  http.get(`${API}/documents/:id`, detailHandler(() => store.documents)),
  http.post(
    `${API}/documents`,
    createHandler(() => store.documents, 'doc', (body, id, meta) => ({
      id,
      name: String(body.name ?? 'Demo Document'),
      category: String(body.category ?? 'General'),
      status: (body.status as 'valid') ?? 'pending_review',
      uploadedBy: String(body.uploadedBy ?? 'Demo User'),
      fileSize: Number(body.fileSize ?? 0),
      mimeType: String(body.mimeType ?? 'application/pdf'),
      relatedType: body.relatedType as string | undefined,
      relatedReference: body.relatedReference as string | undefined,
      ...meta,
    })),
  ),
  http.patch(`${API}/documents/:id`, patchHandler(() => store.documents)),

  http.get(`${API}/approvals`, listHandler(() => store.approvals, ['recordReference', 'requester', 'module'])),
  http.get(`${API}/approvals/:id`, detailHandler(() => store.approvals)),
  http.post(`${API}/approvals/:id/approve`, async ({ params }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    return mutateApproval(String(params.id ?? ''), 'approved', session.user.id)
  }),
  http.post(`${API}/approvals/:id/reject`, async ({ params }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    return mutateApproval(String(params.id ?? ''), 'rejected', session.user.id)
  }),
  http.post(`${API}/approvals/:id/return`, async ({ params }) => {
    await delay()
    const session = requireSession()
    if (session instanceof HttpResponse) return session
    return mutateApproval(String(params.id ?? ''), 'returned', session.user.id)
  }),

  http.get(`${API}/notifications`, listHandler(() => store.notifications, ['title', 'body', 'category'])),
  http.patch(`${API}/notifications/:id/read`, async ({ params }) => {
    await delay()
    const id = String(params.id ?? '')
    const index = store.notifications.findIndex((n) => n.id === id)
    if (index < 0) return error(404, `Notification ${id} not found`)
    store.notifications[index] = { ...store.notifications[index], read: true }
    return HttpResponse.json(store.notifications[index])
  }),
  http.post(`${API}/notifications/mark-all-read`, async () => {
    await delay()
    store.notifications = store.notifications.map((n) => ({ ...n, read: true }))
    return HttpResponse.json({ message: 'All notifications marked read (demo)' })
  }),

  http.get(`${API}/tasks`, listHandler(() => store.tasks, ['title', 'module', 'relatedReference'])),

  http.get(`${API}/reports/catalog`, async () => {
    await delay()
    return HttpResponse.json({
      isDemo: true,
      reports: [
        { id: 'rep-import-pipeline', name: 'Import pipeline summary (Demo)', module: 'imports' },
        { id: 'rep-inventory-valuation', name: 'Inventory valuation (Demo)', module: 'inventory' },
        { id: 'rep-tender-pipeline', name: 'Tender pipeline (Demo)', module: 'tenders' },
        { id: 'rep-ar-aging', name: 'Receivables aging (Demo)', module: 'receivables' },
        { id: 'rep-audit-trail', name: 'Audit trail export (Demo)', module: 'audit' },
      ],
    })
  }),

  http.get(`${API}/employees`, listHandler(() => store.employees, ['employeeCode', 'firstName', 'lastName', 'email'])),
  http.get(`${API}/employees/:id`, detailHandler(() => store.employees)),
  http.post(
    `${API}/employees`,
    createHandler(() => store.employees, 'emp', (body, id, meta) => ({
      id,
      employeeCode: String(body.employeeCode ?? `SARU-DEMO-${id}`),
      firstName: String(body.firstName ?? 'Demo'),
      lastName: String(body.lastName ?? 'Employee'),
      email: String(body.email ?? `staff.${id}@saru.demo`),
      role: String(body.role ?? 'Staff'),
      department: body.department as string | undefined,
      status: (body.status as 'active') ?? 'active',
      ...meta,
    })),
  ),
  http.patch(`${API}/employees/:id`, patchHandler(() => store.employees)),

  http.get(`${API}/audit`, listHandler(() => store.auditLogs, ['user', 'action', 'module', 'recordReference'])),

  http.get(`${API}/settings/company`, async () => {
    await delay()
    return HttpResponse.json({
      isDemo: true,
      organization: DEMO_ORGANIZATION,
      legalName: 'Saru International (Demonstration)',
      tradeName: 'Saru Demo',
      ntn: 'DEMO-NTN-000000',
      strn: 'DEMO-STRN-000000',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      address: 'Demo Tower, Block 7, Clifton, Karachi, Pakistan',
    })
  }),

  http.get(`${API}/settings/health`, async () => {
    await delay()
    return HttpResponse.json({
      isDemo: true,
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      version: 'mock-1.0.0',
      uptimeSeconds: 86400,
      services: [
        { name: 'api', status: 'up', latencyMs: 42 },
        { name: 'database', status: 'up', latencyMs: 18 },
        { name: 'storage', status: 'up', latencyMs: 31 },
      ],
    })
  }),

  http.get(`${API}/categories`, listHandler(() => store.categories, ['code', 'name', 'parentName'])),
  http.get(
    `${API}/inventory/receipts`,
    listHandler(() => store.goodsReceipts, ['reference', 'shipmentReference', 'warehouseName']),
  ),
  http.get(
    `${API}/inventory/reservations`,
    listHandler(() => store.reservations, ['sku', 'productName', 'warehouseName', 'sourceReference']),
  ),
  http.get(
    `${API}/inventory/stock-counts`,
    listHandler(() => store.stockCounts, ['reference', 'warehouseName']),
  ),
  http.get(
    `${API}/inventory/transfers`,
    listHandler(() => store.transfers, ['reference', 'fromWarehouse', 'toWarehouse']),
  ),
  http.get(
    `${API}/inventory/quality`,
    listHandler(() => store.qualityInspections, ['reference', 'sku', 'productName', 'warehouseName']),
  ),
  http.get(
    `${API}/analytics/summary`,
    listHandler(() => store.analyticsRows, ['metric', 'period', 'unit', 'note']),
  ),
  http.get(
    `${API}/settings/notification-config`,
    listHandler(() => store.notificationConfigs, ['eventType', 'channel', 'audience']),
  ),
  http.get(
    `${API}/settings/integrations`,
    listHandler(() => store.integrations, ['name', 'provider', 'notes']),
  ),
  http.get(`${API}/settings/roles`, listHandler(() => store.roles, ['code', 'name', 'description'])),
]
