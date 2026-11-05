import type { Permission, PermissionAction, PermissionModule, SystemRole } from '@/types/permissions'
import type { AuthUser } from '@/types/auth'

const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit_draft',
  'submit',
  'approve',
  'finalize',
  'cancel',
  'reverse',
  'export',
  'administer',
]

const ALL_MODULES: PermissionModule[] = [
  'dashboard',
  'tasks',
  'notifications',
  'products',
  'categories',
  'suppliers',
  'manufacturers',
  'departments',
  'imports',
  'receipts',
  'warehouses',
  'inventory',
  'stock_movements',
  'reservations',
  'stock_counts',
  'transfers',
  'quality',
  'tenders',
  'bids',
  'contracts',
  'tender_compliance',
  'securities',
  'deliveries',
  'challans',
  'invoices',
  'payments',
  'receivables',
  'documents',
  'reports',
  'analytics',
  'employees',
  'roles',
  'approvals',
  'templates',
  'notification_config',
  'company_settings',
  'audit',
  'integrations',
  'system_health',
]

function expand(modules: PermissionModule[], actions: PermissionAction[]): Permission[] {
  return modules.flatMap((m) => actions.map((a) => `${m}:${a}` as Permission))
}

function allPermissions(): Permission[] {
  return expand(ALL_MODULES, ALL_ACTIONS)
}

/** Demo role → permission map. Backend remains authoritative in production. */
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  owner: allPermissions(),
  tender_manager: [
    ...expand(
      [
        'dashboard',
        'tasks',
        'notifications',
        'products',
        'suppliers',
        'manufacturers',
        'departments',
        'tenders',
        'bids',
        'contracts',
        'tender_compliance',
        'securities',
        'documents',
        'approvals',
        'reports',
        'inventory',
        'reservations',
        'deliveries',
      ],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'tenders:approve',
    'tenders:finalize',
    'contracts:approve',
    'securities:approve',
    'approvals:approve',
  ],
  import_manager: [
    ...expand(
      [
        'dashboard',
        'tasks',
        'notifications',
        'products',
        'suppliers',
        'manufacturers',
        'imports',
        'receipts',
        'warehouses',
        'inventory',
        'documents',
        'approvals',
        'reports',
      ],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'imports:approve',
    'imports:finalize',
    'receipts:finalize',
    'approvals:approve',
  ],
  inventory_manager: [
    ...expand(
      [
        'dashboard',
        'tasks',
        'notifications',
        'products',
        'warehouses',
        'inventory',
        'stock_movements',
        'reservations',
        'stock_counts',
        'transfers',
        'quality',
        'receipts',
        'deliveries',
        'documents',
        'approvals',
        'reports',
      ],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'inventory:approve',
    'inventory:finalize',
    'inventory:reverse',
    'quality:approve',
    'approvals:approve',
  ],
  documentation_officer: [
    ...expand(
      [
        'dashboard',
        'tasks',
        'notifications',
        'products',
        'suppliers',
        'manufacturers',
        'departments',
        'tenders',
        'tender_compliance',
        'documents',
        'deliveries',
        'challans',
        'reports',
      ],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
  ],
  accounts_officer: [
    ...expand(
      [
        'dashboard',
        'tasks',
        'notifications',
        'contracts',
        'invoices',
        'payments',
        'receivables',
        'securities',
        'documents',
        'approvals',
        'reports',
        'analytics',
      ],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'invoices:approve',
    'invoices:finalize',
    'payments:approve',
    'payments:finalize',
    'approvals:approve',
  ],
  auditor: expand(ALL_MODULES, ['view', 'export']),
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: Permission | Permission[],
): boolean {
  if (!user || user.status !== 'active') return false
  const required = Array.isArray(permission) ? permission : [permission]
  return required.every((p) => user.permissions.includes(p))
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user || user.status !== 'active') return false
  return permissions.some((p) => user.permissions.includes(p))
}

export function canViewModule(user: AuthUser | null | undefined, module: PermissionModule): boolean {
  return hasPermission(user, `${module}:view`)
}

export function getPermissionsForRole(role: SystemRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
