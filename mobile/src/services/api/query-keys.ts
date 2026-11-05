export const queryKeys = {
  auth: { session: ['auth', 'session'] as const },
  dashboard: { all: ['dashboard'] as const, byRole: (role: string) => ['dashboard', role] as const },
  products: {
    all: ['products'] as const,
    list: (f: unknown) => ['products', 'list', f] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    barcode: (code: string) => ['products', 'barcode', code] as const,
  },
  inventory: {
    stock: (f: unknown) => ['inventory', 'stock', f] as const,
    warehouses: ['inventory', 'warehouses'] as const,
  },
  imports: {
    list: (f: unknown) => ['imports', 'list', f] as const,
    detail: (id: string) => ['imports', 'detail', id] as const,
  },
  tenders: {
    list: (f: unknown) => ['tenders', 'list', f] as const,
    detail: (id: string) => ['tenders', 'detail', id] as const,
  },
  contracts: {
    list: (f: unknown) => ['contracts', 'list', f] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
  },
  securities: {
    list: (f: unknown) => ['securities', 'list', f] as const,
    detail: (id: string) => ['securities', 'detail', id] as const,
  },
  deliveries: {
    list: (f: unknown) => ['deliveries', 'list', f] as const,
    detail: (id: string) => ['deliveries', 'detail', id] as const,
  },
  invoices: {
    list: (f: unknown) => ['invoices', 'list', f] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  payments: {
    list: (f: unknown) => ['payments', 'list', f] as const,
  },
  documents: {
    list: (f: unknown) => ['documents', 'list', f] as const,
  },
  approvals: {
    list: (f: unknown) => ['approvals', 'list', f] as const,
  },
  notifications: {
    list: (f: unknown) => ['notifications', 'list', f] as const,
    unread: ['notifications', 'unread'] as const,
  },
  tasks: {
    list: (f: unknown) => ['tasks', 'list', f] as const,
  },
} as const
