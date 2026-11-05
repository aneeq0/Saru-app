import type { AuthUser } from '@/types/auth'
import type { Permission, PermissionAction, PermissionModule, SystemRole } from '@/types/permissions'

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

const CORE: PermissionModule[] = [
  'dashboard',
  'tasks',
  'notifications',
  'products',
  'documents',
  'approvals',
  'reports',
]

function expand(modules: PermissionModule[], actions: PermissionAction[]): Permission[] {
  return modules.flatMap((m) => actions.map((a) => `${m}:${a}` as Permission))
}

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  owner: expand(
    [
      ...CORE,
      'inventory',
      'warehouses',
      'imports',
      'receipts',
      'tenders',
      'contracts',
      'tender_compliance',
      'securities',
      'deliveries',
      'challans',
      'invoices',
      'payments',
      'receivables',
      'employees',
    ],
    ALL_ACTIONS,
  ),
  tender_manager: [
    ...expand(
      [...CORE, 'tenders', 'contracts', 'tender_compliance', 'securities', 'deliveries', 'inventory'],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'tenders:approve',
    'approvals:approve',
  ],
  import_manager: [
    ...expand(
      [...CORE, 'imports', 'receipts', 'inventory', 'warehouses'],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'imports:approve',
    'receipts:finalize',
    'approvals:approve',
  ],
  inventory_manager: [
    ...expand(
      [...CORE, 'inventory', 'warehouses', 'receipts', 'deliveries', 'imports'],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'inventory:approve',
    'inventory:finalize',
    'approvals:approve',
  ],
  documentation_officer: expand(
    [...CORE, 'tenders', 'tender_compliance', 'deliveries', 'challans'],
    ['view', 'create', 'edit_draft', 'submit', 'export'],
  ),
  accounts_officer: [
    ...expand(
      [...CORE, 'invoices', 'payments', 'receivables', 'contracts', 'securities'],
      ['view', 'create', 'edit_draft', 'submit', 'export'],
    ),
    'invoices:finalize',
    'payments:finalize',
    'approvals:approve',
  ],
  auditor: expand(
    [
      ...CORE,
      'inventory',
      'warehouses',
      'imports',
      'tenders',
      'contracts',
      'securities',
      'deliveries',
      'invoices',
      'payments',
      'receivables',
    ],
    ['view', 'export'],
  ),
}

export function getPermissionsForRole(role: SystemRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
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

export function canViewModule(
  user: AuthUser | null | undefined,
  module: PermissionModule,
): boolean {
  return hasPermission(user, `${module}:view`)
}
