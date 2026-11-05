import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/app/layouts/app-shell'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { NotFoundPage } from '@/features/auth/pages/not-found-page'
import { UnauthorizedPage } from '@/features/auth/pages/unauthorized-page'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

function lazyNamed<T extends Record<string, ComponentType>>(loader: () => Promise<T>, name: keyof T) {
  return lazy(() => loader().then((module) => ({ default: module[name] as ComponentType })))
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSkeleton rows={6} className="p-4" />}>{children}</Suspense>
}

const DashboardPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DashboardPage')
const TasksPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TasksPage')
const NotificationsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'NotificationsPage')
const ProductsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ProductsPage')
const ProductDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ProductDetailPage')
const ProductFormPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ProductFormPage')
const CategoriesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'CategoriesPage')
const SuppliersPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'SuppliersPage')
const SupplierDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'SupplierDetailPage')
const ManufacturersPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ManufacturersPage')
const DepartmentsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DepartmentsPage')
const ImportsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ImportsPage')
const ImportDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ImportDetailPage')
const ReceiptsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ReceiptsPage')
const WarehousesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'WarehousesPage')
const InventoryStockPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'InventoryStockPage')
const StockMovementsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'StockMovementsPage')
const ReservationsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ReservationsPage')
const StockCountsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'StockCountsPage')
const TransfersPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TransfersPage')
const QualityPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'QualityPage')
const TendersPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TendersPage')
const TenderDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TenderDetailPage')
const TenderFormPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TenderFormPage')
const ManufacturerDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ManufacturerDetailPage')
const DepartmentDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DepartmentDetailPage')
const SecurityDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'SecurityDetailPage')
const DeliveryDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DeliveryDetailPage')
const PaymentDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'PaymentDetailPage')
const BidsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'BidsPage')
const ContractsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ContractsPage')
const ContractDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ContractDetailPage')
const TenderCompliancePage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TenderCompliancePage')
const SecuritiesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'SecuritiesPage')
const DeliveriesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DeliveriesPage')
const ChallansPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ChallansPage')
const InvoicesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'InvoicesPage')
const InvoiceDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'InvoiceDetailPage')
const PaymentsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'PaymentsPage')
const ReceivablesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ReceivablesPage')
const DocumentsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'DocumentsPage')
const ReportsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ReportsPage')
const AnalyticsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'AnalyticsPage')
const EmployeesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'EmployeesPage')
const EmployeeDetailPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'EmployeeDetailPage')
const RolesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'RolesPage')
const ApprovalsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'ApprovalsPage')
const TemplatesPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'TemplatesPage')
const NotificationConfigPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'NotificationConfigPage')
const CompanySettingsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'CompanySettingsPage')
const AuditPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'AuditPage')
const IntegrationsPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'IntegrationsPage')
const SystemHealthPage = lazyNamed(() => import('@/app/router/lazy-pages'), 'SystemHealthPage')

function withSuspense(element: React.ReactNode) {
  return <LazyPage>{element}</LazyPage>
}

const protectedChildren: RouteObject[] = [
  { index: true, element: <Navigate to="/dashboard" replace /> },
  { path: 'dashboard', element: withSuspense(<DashboardPage />) },
  { path: 'tasks', element: withSuspense(<TasksPage />) },
  { path: 'notifications', element: withSuspense(<NotificationsPage />) },
  { path: 'products', element: withSuspense(<ProductsPage />) },
  { path: 'products/new', element: withSuspense(<ProductFormPage />) },
  { path: 'products/:id/edit', element: withSuspense(<ProductFormPage />) },
  { path: 'products/:id', element: withSuspense(<ProductDetailPage />) },
  { path: 'categories', element: withSuspense(<CategoriesPage />) },
  { path: 'suppliers', element: withSuspense(<SuppliersPage />) },
  { path: 'suppliers/:id', element: withSuspense(<SupplierDetailPage />) },
  { path: 'manufacturers', element: withSuspense(<ManufacturersPage />) },
  { path: 'manufacturers/:id', element: withSuspense(<ManufacturerDetailPage />) },
  { path: 'departments', element: withSuspense(<DepartmentsPage />) },
  { path: 'departments/:id', element: withSuspense(<DepartmentDetailPage />) },
  { path: 'imports', element: withSuspense(<ImportsPage />) },
  { path: 'imports/:id', element: withSuspense(<ImportDetailPage />) },
  { path: 'receipts', element: withSuspense(<ReceiptsPage />) },
  { path: 'warehouses', element: withSuspense(<WarehousesPage />) },
  { path: 'inventory/stock', element: withSuspense(<InventoryStockPage />) },
  { path: 'inventory/movements', element: withSuspense(<StockMovementsPage />) },
  { path: 'inventory/reservations', element: withSuspense(<ReservationsPage />) },
  { path: 'inventory/stock-counts', element: withSuspense(<StockCountsPage />) },
  { path: 'inventory/transfers', element: withSuspense(<TransfersPage />) },
  { path: 'quality', element: withSuspense(<QualityPage />) },
  { path: 'tenders', element: withSuspense(<TendersPage />) },
  { path: 'tenders/new', element: withSuspense(<TenderFormPage />) },
  { path: 'tenders/:id', element: withSuspense(<TenderDetailPage />) },
  { path: 'bids', element: withSuspense(<BidsPage />) },
  { path: 'contracts', element: withSuspense(<ContractsPage />) },
  { path: 'contracts/:id', element: withSuspense(<ContractDetailPage />) },
  { path: 'tender-compliance', element: withSuspense(<TenderCompliancePage />) },
  { path: 'securities', element: withSuspense(<SecuritiesPage />) },
  { path: 'securities/:id', element: withSuspense(<SecurityDetailPage />) },
  { path: 'deliveries', element: withSuspense(<DeliveriesPage />) },
  { path: 'deliveries/:id', element: withSuspense(<DeliveryDetailPage />) },
  { path: 'challans', element: withSuspense(<ChallansPage />) },
  { path: 'invoices', element: withSuspense(<InvoicesPage />) },
  { path: 'invoices/:id', element: withSuspense(<InvoiceDetailPage />) },
  { path: 'payments', element: withSuspense(<PaymentsPage />) },
  { path: 'payments/:id', element: withSuspense(<PaymentDetailPage />) },
  { path: 'receivables', element: withSuspense(<ReceivablesPage />) },
  { path: 'documents', element: withSuspense(<DocumentsPage />) },
  { path: 'reports', element: withSuspense(<ReportsPage />) },
  { path: 'analytics', element: withSuspense(<AnalyticsPage />) },
  { path: 'approvals', element: withSuspense(<ApprovalsPage />) },
  { path: 'admin/employees', element: withSuspense(<EmployeesPage />) },
  { path: 'admin/employees/:id', element: withSuspense(<EmployeeDetailPage />) },
  { path: 'admin/roles', element: withSuspense(<RolesPage />) },
  { path: 'admin/templates', element: withSuspense(<TemplatesPage />) },
  { path: 'admin/notifications', element: withSuspense(<NotificationConfigPage />) },
  { path: 'admin/settings', element: withSuspense(<CompanySettingsPage />) },
  { path: 'admin/audit', element: withSuspense(<AuditPage />) },
  { path: 'admin/integrations', element: withSuspense(<IntegrationsPage />) },
  { path: 'admin/system-health', element: withSuspense(<SystemHealthPage />) },
]

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: protectedChildren,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
