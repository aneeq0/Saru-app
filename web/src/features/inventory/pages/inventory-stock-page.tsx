import { useMemo } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate, formatQuantity } from '@/lib/format'
import type { StockBalance } from '@/types/entities'
import { useStockList } from '../hooks/use-inventory'

export function InventoryStockPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'sku', desc: false }] })
  const query = useStockList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
  })

  const columns = useMemo<ColumnDef<StockBalance>[]>(
    () => [
      { accessorKey: 'sku', header: 'SKU' },
      { accessorKey: 'productName', header: 'Product' },
      { accessorKey: 'warehouseName', header: 'Warehouse' },
      { accessorKey: 'batch', header: 'Batch' },
      {
        accessorKey: 'onHand',
        header: 'On hand',
        cell: ({ row }) => (
          <span className="tabular-nums">{formatQuantity(row.original.onHand, row.original.unit)}</span>
        ),
      },
      {
        accessorKey: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <span className="tabular-nums">{formatQuantity(row.original.available, row.original.unit)}</span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">
            {getValue() ? formatDate(String(getValue())) : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader title="Stock levels" description="On-hand, reserved, and available quantities by warehouse." />
      <div className="mb-4">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search SKU or product…"
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
        emptyTitle="No stock records"
        emptyDescription="Receipts and adjustments will populate warehouse balances."
      />
    </div>
  )
}

export default InventoryStockPage
