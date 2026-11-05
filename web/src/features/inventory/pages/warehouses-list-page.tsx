import { useMemo } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import type { Warehouse } from '@/types/entities'
import { useWarehousesList } from '../hooks/use-inventory'

export function WarehousesListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'code', desc: false }] })
  const query = useWarehousesList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
  })

  const columns = useMemo<ColumnDef<Warehouse>[]>(
    () => [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Warehouse' },
      { accessorKey: 'city', header: 'City' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader title="Warehouses" description="Storage locations used for stock balances and deliveries." />
      <div className="mb-4">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search code or name…"
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
        emptyTitle="No warehouses"
        emptyDescription="Configure warehouse sites to track inventory by location."
      />
    </div>
  )
}

export default WarehousesListPage
