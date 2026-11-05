import {
  approvals,
  buildDashboard,
  createSession,
  contracts,
  DEMO_PASSWORD,
  deliveries,
  demoUsers,
  documents,
  imports,
  invoices,
  notifications,
  payments,
  products,
  securities,
  stock,
  tasks,
  tenders,
  warehouses,
} from '@/mocks/data'
import type { PaginatedResponse } from '@/types/api'
import type { LoginRequest, LoginResponse, SessionInfo } from '@/types/auth'
import type { SystemRole } from '@/types/permissions'

let session: SessionInfo | null = null

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const start = (page - 1) * pageSize
  const data = items.slice(start, start + pageSize)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextCursor: null,
    },
  }
}

function requireSession() {
  if (!session) {
    const err = new Error('No active session') as Error & { status: number }
    err.status = 401
    throw err
  }
  return session
}

function parseQuery(path: string) {
  const idx = path.indexOf('?')
  if (idx < 0) return { pathname: path, params: new URLSearchParams() }
  return { pathname: path.slice(0, idx), params: new URLSearchParams(path.slice(idx + 1)) }
}

export const mockApi = {
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    await delay()
    const { pathname, params } = parseQuery(path)
    const page = Number(params.get('page') ?? 1)
    const pageSize = Number(params.get('pageSize') ?? 20)
    const q = (params.get('q') ?? params.get('search') ?? '').toLowerCase()

    if (method === 'POST' && pathname === '/auth/login') {
      const payload = body as LoginRequest
      const record = demoUsers.find((u) => u.user.email.toLowerCase() === payload.email.trim().toLowerCase())
      if (!record || payload.password !== DEMO_PASSWORD) {
        const err = new Error('Invalid email or password') as Error & { status: number }
        err.status = 401
        throw err
      }
      if (record.user.status !== 'active') {
        const err = new Error('Account is not active') as Error & { status: number }
        err.status = 403
        throw err
      }
      session = createSession(record.user)
      return { session } as T
    }

    if (method === 'POST' && pathname === '/auth/logout') {
      session = null
      return undefined as T
    }

    if (method === 'GET' && pathname === '/auth/session') {
      if (!session) {
        const err = new Error('No active session') as Error & { status: number }
        err.status = 401
        throw err
      }
      return session as T
    }

    if (method === 'POST' && pathname === '/auth/forgot-password') {
      return { message: 'If the account exists, reset instructions were sent.' } as T
    }

    const current = requireSession()

    if (method === 'GET' && pathname === '/dashboard') {
      return buildDashboard(current.user.role as SystemRole) as T
    }

    if (method === 'GET' && pathname === '/products') {
      const filtered = products.filter(
        (p) => !q || p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      )
      return paginate(filtered, page, pageSize) as T
    }

    if (method === 'GET' && pathname.startsWith('/products/barcode/')) {
      const code = decodeURIComponent(pathname.replace('/products/barcode/', ''))
      const product = products.find((p) => p.barcode === code || p.sku === code)
      if (!product) {
        const err = new Error('Product not found for scanned code') as Error & { status: number }
        err.status = 404
        throw err
      }
      return product as T
    }

    if (method === 'GET' && pathname.startsWith('/products/')) {
      const id = pathname.split('/')[2]
      const product = products.find((p) => p.id === id)
      if (!product) {
        const err = new Error('Product not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      return product as T
    }

    if (method === 'GET' && pathname === '/inventory/stock') {
      const filtered = stock.filter(
        (s) => !q || s.sku.toLowerCase().includes(q) || s.productName.toLowerCase().includes(q),
      )
      return paginate(filtered, page, pageSize) as T
    }

    if (method === 'GET' && pathname === '/inventory/warehouses') {
      return warehouses as T
    }

    if (method === 'GET' && pathname === '/imports') {
      const filtered = imports.filter(
        (i) => !q || i.reference.toLowerCase().includes(q) || i.supplierName.toLowerCase().includes(q),
      )
      return paginate(filtered, page, pageSize) as T
    }

    if (method === 'GET' && pathname.startsWith('/imports/')) {
      const item = imports.find((i) => i.id === pathname.split('/')[2])
      if (!item) {
        const err = new Error('Shipment not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      return item as T
    }

    if (method === 'GET' && pathname === '/tenders') {
      const filtered = tenders.filter(
        (t) => !q || t.tenderNumber.toLowerCase().includes(q) || t.title.toLowerCase().includes(q),
      )
      return paginate(filtered, page, pageSize) as T
    }

    if (method === 'GET' && pathname.startsWith('/tenders/')) {
      const item = tenders.find((t) => t.id === pathname.split('/')[2])
      if (!item) {
        const err = new Error('Tender not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      return item as T
    }

    if (method === 'GET' && pathname === '/contracts') return paginate(contracts, page, pageSize) as T
    if (method === 'GET' && pathname === '/securities') return paginate(securities, page, pageSize) as T
    if (method === 'GET' && pathname === '/deliveries') {
      const filtered = deliveries.filter(
        (d) => !q || d.deliveryNumber.toLowerCase().includes(q) || d.departmentName.toLowerCase().includes(q),
      )
      return paginate(filtered, page, pageSize) as T
    }
    if (method === 'GET' && pathname.startsWith('/deliveries/')) {
      const item = deliveries.find((d) => d.id === pathname.split('/')[2])
      if (!item) {
        const err = new Error('Delivery not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      return item as T
    }

    if (method === 'POST' && pathname.match(/^\/deliveries\/[^/]+\/confirm-dispatch$/)) {
      const id = pathname.split('/')[2]
      const item = deliveries.find((d) => d.id === id)
      if (!item) {
        const err = new Error('Delivery not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      if (item.status === 'dispatched' || item.status === 'delivered') {
        const err = new Error('Dispatch already confirmed') as Error & { status: number }
        err.status = 409
        throw err
      }
      item.status = 'dispatched'
      item.updatedAt = new Date().toISOString()
      return item as T
    }

    if (method === 'GET' && pathname === '/invoices') return paginate(invoices, page, pageSize) as T
    if (method === 'GET' && pathname === '/payments') return paginate(payments, page, pageSize) as T
    if (method === 'GET' && pathname === '/documents') return paginate(documents, page, pageSize) as T
    if (method === 'GET' && pathname === '/approvals') return paginate(approvals, page, pageSize) as T
    if (method === 'GET' && pathname === '/notifications') return paginate(notifications, page, pageSize) as T
    if (method === 'GET' && pathname === '/tasks') return paginate(tasks, page, pageSize) as T

    if (method === 'POST' && pathname.match(/^\/approvals\/[^/]+\/approve$/)) {
      const id = pathname.split('/')[2]
      const item = approvals.find((a) => a.id === id)
      if (!item) {
        const err = new Error('Approval not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      item.status = 'approved'
      return item as T
    }

    if (method === 'POST' && pathname.match(/^\/approvals\/[^/]+\/reject$/)) {
      const id = pathname.split('/')[2]
      const item = approvals.find((a) => a.id === id)
      if (!item) {
        const err = new Error('Approval not found') as Error & { status: number }
        err.status = 404
        throw err
      }
      item.status = 'rejected'
      return item as T
    }

    if (method === 'PATCH' && pathname.match(/^\/notifications\/[^/]+\/read$/)) {
      const id = pathname.split('/')[2]
      const item = notifications.find((n) => n.id === id)
      if (item) item.read = true
      return item as T
    }

    const err = new Error(`Mock route not implemented: ${method} ${pathname}`) as Error & {
      status: number
    }
    err.status = 404
    throw err
  },
}

export function resetMockSession() {
  session = null
}

export function restoreMockSession(info: SessionInfo) {
  session = info
}

export type { LoginResponse }
