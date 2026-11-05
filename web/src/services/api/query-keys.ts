export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    byRole: (role: string) => ['dashboard', role] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters: unknown) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters: unknown) => ['suppliers', 'list', filters] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },
  manufacturers: {
    all: ['manufacturers'] as const,
    list: (filters: unknown) => ['manufacturers', 'list', filters] as const,
    detail: (id: string) => ['manufacturers', 'detail', id] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (filters: unknown) => ['departments', 'list', filters] as const,
    detail: (id: string) => ['departments', 'detail', id] as const,
  },
  imports: {
    all: ['imports'] as const,
    list: (filters: unknown) => ['imports', 'list', filters] as const,
    detail: (id: string) => ['imports', 'detail', id] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    stock: (filters: unknown) => ['inventory', 'stock', filters] as const,
    movements: (filters: unknown) => ['inventory', 'movements', filters] as const,
    warehouses: ['inventory', 'warehouses'] as const,
  },
  tenders: {
    all: ['tenders'] as const,
    list: (filters: unknown) => ['tenders', 'list', filters] as const,
    detail: (id: string) => ['tenders', 'detail', id] as const,
  },
  contracts: {
    all: ['contracts'] as const,
    list: (filters: unknown) => ['contracts', 'list', filters] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
  },
  securities: {
    all: ['securities'] as const,
    list: (filters: unknown) => ['securities', 'list', filters] as const,
    detail: (id: string) => ['securities', 'detail', id] as const,
  },
  deliveries: {
    all: ['deliveries'] as const,
    list: (filters: unknown) => ['deliveries', 'list', filters] as const,
    detail: (id: string) => ['deliveries', 'detail', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (filters: unknown) => ['invoices', 'list', filters] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  payments: {
    all: ['payments'] as const,
    list: (filters: unknown) => ['payments', 'list', filters] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    receivables: (filters: unknown) => ['payments', 'receivables', filters] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (filters: unknown) => ['documents', 'list', filters] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    list: (filters: unknown) => ['approvals', 'list', filters] as const,
    detail: (id: string) => ['approvals', 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters: unknown) => ['notifications', 'list', filters] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters: unknown) => ['tasks', 'list', filters] as const,
  },
  reports: {
    all: ['reports'] as const,
    catalog: ['reports', 'catalog'] as const,
    job: (id: string) => ['reports', 'job', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters: unknown) => ['employees', 'list', filters] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: ['roles', 'list'] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (filters: unknown) => ['audit', 'list', filters] as const,
  },
  settings: {
    company: ['settings', 'company'] as const,
    health: ['settings', 'health'] as const,
  },
  search: {
    global: (q: string) => ['search', 'global', q] as const,
  },
} as const
