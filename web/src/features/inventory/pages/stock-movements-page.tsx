import { useMemo } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate, formatQuantity } from '@/lib/format'
import type { StockMovement } from '@/types/entities'
import { useStockMovementsList } from '../hooks/use-inventory'

export function StockMovementsPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'occurredAt', desc: true }] })
  const query = useStockMovementsList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
  })

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      { accessorKey: 'sku', header: 'SKU' },
      { accessorKey: 'productName', header: 'Product' },
      { accessorKey: 'warehouseName', header: 'Warehouse' },
      {
        accessorKey: 'movementType',
        header: 'Type',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <span className="tabular-nums">{formatQuantity(row.original.quantity, row.original.unit)}</span>
        ),
      },
      { accessorKey: 'reference', header: 'Reference' },
      {
        accessorKey: 'occurredAt',
        header: 'When',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">{formatDate(String(getValue()))}</span>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader title="Stock movements" description="Receipts, issues, and adjustments across warehouses." />
      <div className="mb-4">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search SKU or reference…"
          className="w-full sm:max-w-sm"
        />
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
        emptyTitle="No movements found"
        emptyDescription="Inventory transactions will appear here as they are recorded."
      />
    </div>
  )
}

export default StockMovementsPage
