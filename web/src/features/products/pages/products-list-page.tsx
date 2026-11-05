import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { PermissionGuard } from '@/components/shared/permission-guard'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate, formatQuantity } from '@/lib/format'
import type { Product } from '@/types/entities'
import { useProductList } from '../hooks/use-products'

export function ProductsListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'updatedAt', desc: true }] })
  const query = useProductList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
    status: state.filters.status,
  })

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <Link to={`/products/${row.original.id}`} className="font-medium text-teal hover:underline">
            {row.original.sku}
          </Link>
        ),
      },
      { accessorKey: 'name', header: 'Product' },
      { accessorKey: 'categoryName', header: 'Category' },
      { accessorKey: 'manufacturerName', header: 'Manufacturer' },
      {
        accessorKey: 'variantCount',
        header: 'Variants',
        cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      },
      { accessorKey: 'packagingUnit', header: 'Unit' },
      {
        accessorKey: 'stockAvailable',
        header: 'Available',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatQuantity(row.original.stockAvailable, row.original.packagingUnit)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">{formatDate(String(getValue()))}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Products"
        description="Medical supply catalogue with variants, packaging, and stock availability."
        actions={
          <PermissionGuard permission="products:create">
            <Button asChild variant="teal">
              <Link to="/products/new">
                <Plus className="h-4 w-4" />
                New product
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search SKU or product name…"
          className="w-full sm:max-w-sm"
        />
        <select
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
          value={state.filters.status ?? ''}
          onChange={(e) =>
            setState({ filters: { ...state.filters, status: e.target.value }, page: 1 })
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        total={query.data?.meta?.total ?? 0}
        page={state.page}
        pageSize={state.pageSize}
        sorting={state.sorting}
        onSortingChange={(updater) => {
          const next = typeof updater === 'function' ? updater(state.sorting) : updater
          setState({ sorting: next as SortingState, page: 1 })
        }}
        onPageChange={(page) => setState({ page })}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        getRowId={(row) => row.id}
        emptyTitle="No products found"
        emptyDescription="Add catalogue items to begin import and tender workflows."
      />
    </div>
  )
}

export default ProductsListPage
