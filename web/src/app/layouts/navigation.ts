import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Archive,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileStack,
  FileText,
  FolderTree,
  Gavel,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageCheck,
  Receipt,
  Scale,
  Settings,
  Shield,
  Ship,
  Truck,
  Users,
  Warehouse,
  Workflow,
} from 'lucide-react'
import type { PermissionModule } from '@/types/permissions'

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
  module: PermissionModule
  keywords?: string[]
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'OVERVIEW',
    items: [
      { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { title: 'Tasks', path: '/tasks', icon: ListChecks, module: 'tasks', keywords: ['work', 'queue'] },
      {
        title: 'Notifications',
        path: '/notifications',
        icon: Bell,
        module: 'notifications',
        keywords: ['alerts'],
      },
    ],
  },
  {
    id: 'catalogue',
    label: 'CATALOGUE & PARTNERS',
    items: [
      { title: 'Products', path: '/products', icon: Package, module: 'products' },
      { title: 'Categories', path: '/categories', icon: FolderTree, module: 'categories' },
      { title: 'Suppliers', path: '/suppliers', icon: Building2, module: 'suppliers' },
      { title: 'Manufacturers', path: '/manufacturers', icon: Boxes, module: 'manufacturers' },
      { title: 'Departments', path: '/departments', icon: Users, module: 'departments' },
    ],
  },
  {
    id: 'imports-inventory',
    label: 'IMPORTS & INVENTORY',
    items: [
      { title: 'Imports', path: '/imports', icon: Ship, module: 'imports' },
      { title: 'Receipts', path: '/receipts', icon: PackageCheck, module: 'receipts' },
      { title: 'Warehouses', path: '/warehouses', icon: Warehouse, module: 'warehouses' },
      { title: 'Stock levels', path: '/inventory/stock', icon: Archive, module: 'inventory' },
      {
        title: 'Stock movements',
        path: '/inventory/movements',
        icon: Workflow,
        module: 'stock_movements',
      },
      { title: 'Reservations', path: '/inventory/reservations', icon: ClipboardList, module: 'reservations' },
      { title: 'Stock counts', path: '/inventory/stock-counts', icon: Scale, module: 'stock_counts' },
      { title: 'Transfers', path: '/inventory/transfers', icon: Truck, module: 'transfers' },
      { title: 'Quality', path: '/quality', icon: BadgeCheck, module: 'quality' },
    ],
  },
  {
    id: 'tenders',
    label: 'TENDERS & CONTRACTS',
    items: [
      { title: 'Tenders', path: '/tenders', icon: Gavel, module: 'tenders' },
      { title: 'Bids', path: '/bids', icon: FileText, module: 'bids' },
      { title: 'Contracts', path: '/contracts', icon: FileStack, module: 'contracts' },
      {
        title: 'Tender compliance',
        path: '/tender-compliance',
        icon: Shield,
        module: 'tender_compliance',
      },
      { title: 'Securities', path: '/securities', icon: HandCoins, module: 'securities' },
    ],
  },
  {
    id: 'fulfilment',
    label: 'FULFILMENT & FINANCE',
    items: [
      { title: 'Deliveries', path: '/deliveries', icon: Truck, module: 'deliveries' },
      { title: 'Challans', path: '/challans', icon: ClipboardCheck, module: 'challans' },
      { title: 'Invoices', path: '/invoices', icon: Receipt, module: 'invoices' },
      { title: 'Payments', path: '/payments', icon: HandCoins, module: 'payments' },
      { title: 'Receivables', path: '/receivables', icon: BarChart3, module: 'receivables' },
    ],
  },
  {
    id: 'documents',
    label: 'DOCUMENTS & ANALYTICS',
    items: [
      { title: 'Documents', path: '/documents', icon: FileText, module: 'documents' },
      { title: 'Reports', path: '/reports', icon: BarChart3, module: 'reports' },
      { title: 'Analytics', path: '/analytics', icon: Activity, module: 'analytics' },
    ],
  },
  {
    id: 'administration',
    label: 'ADMINISTRATION',
    items: [
      { title: 'Employees', path: '/admin/employees', icon: Users, module: 'employees' },
      { title: 'Roles', path: '/admin/roles', icon: Shield, module: 'roles' },
      { title: 'Approvals', path: '/approvals', icon: BadgeCheck, module: 'approvals' },
      { title: 'Templates', path: '/admin/templates', icon: FileStack, module: 'templates' },
      {
        title: 'Notification config',
        path: '/admin/notifications',
        icon: Bell,
        module: 'notification_config',
      },
      {
        title: 'Company settings',
        path: '/admin/settings',
        icon: Settings,
        module: 'company_settings',
      },
      { title: 'Audit log', path: '/admin/audit', icon: ClipboardList, module: 'audit' },
      { title: 'Integrations', path: '/admin/integrations', icon: Workflow, module: 'integrations' },
      { title: 'System health', path: '/admin/system-health', icon: Activity, module: 'system_health' },
    ],
  },
]

export const FLAT_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function findNavItemByPath(pathname: string): NavItem | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return FLAT_NAV_ITEMS.find((item) => {
    if (item.path === normalized) return true
    if (normalized.startsWith(`${item.path}/`)) return true
    return false
  })
}
