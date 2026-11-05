import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ReceivableLine } from '@/types/entities'
import { useReceivablesList } from '../hooks/use-receivables'

export function ReceivablesListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'dueDate', desc: false }] })
  const query = useReceivablesList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
  })

  const columns = useMemo<ColumnDef<ReceivableLine>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice',
        cell: ({ row }) => (
          <Link to={`/invoices/${row.original.id}`} className="font-medium text-teal hover:underline">
            {row.original.invoiceNumber}
          </Link>
        ),
      },
      { accessorKey: 'departmentName', header: 'Department' },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">
            {getValue() ? formatDate(String(getValue())) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'balanceDue',
        header: 'Balance',
        cell: ({ row }) => (
          <span className="tabular-nums">{formatCurrency(row.original.balanceDue, row.original.currency)}</span>
        ),
      },
      {
        accessorKey: 'daysOverdue',
        header: 'Days overdue',
        cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? 0)}</span>,
      },
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
      <PageHeader title="Receivables" description="Outstanding invoice balances and aging indicators." />
      <div className="mb-4">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search invoice or department…"
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
        emptyTitle="No receivables"
        emptyDescription="Issued invoices with open balances appear here."
      />
    </div>
  )
}

export default ReceivablesListPage
