/** Granular action permissions — backend remains the authority. */
export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit_draft'
  | 'submit'
  | 'approve'
  | 'finalize'
  | 'cancel'
  | 'reverse'
  | 'export'
  | 'administer'

export type PermissionModule =
  | 'dashboard'
  | 'tasks'
  | 'notifications'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'manufacturers'
  | 'departments'
  | 'imports'
  | 'receipts'
  | 'warehouses'
  | 'inventory'
  | 'stock_movements'
  | 'reservations'
  | 'stock_counts'
  | 'transfers'
  | 'quality'
  | 'tenders'
  | 'bids'
  | 'contracts'
  | 'tender_compliance'
  | 'securities'
  | 'deliveries'
  | 'challans'
  | 'invoices'
  | 'payments'
  | 'receivables'
  | 'documents'
  | 'reports'
  | 'analytics'
  | 'employees'
  | 'roles'
  | 'approvals'
  | 'templates'
  | 'notification_config'
  | 'company_settings'
  | 'audit'
  | 'integrations'
  | 'system_health'

export type Permission = `${PermissionModule}:${PermissionAction}`

export type SystemRole =
  | 'owner'
  | 'tender_manager'
  | 'import_manager'
  | 'inventory_manager'
  | 'documentation_officer'
  | 'accounts_officer'
  | 'auditor'

export interface PermissionScope {
  warehouseIds?: string[]
  departmentIds?: string[]
  recordIds?: string[]
}

export interface UserPermissions {
  permissions: Permission[]
  scopes?: Partial<Record<PermissionModule, PermissionScope>>
}
