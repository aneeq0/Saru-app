import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { PermissionGuard } from '@/components/shared/permission-guard'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Tender } from '@/types/entities'
import { useTendersList } from '../hooks/use-tenders'

export function TendersListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'updatedAt', desc: true }] })
  const query = useTendersList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
    stage: state.filters.stage
  })

  const columns = useMemo<ColumnDef<Tender>[]>(
    () => [
      {
        accessorKey: 'tenderNumber',
        header: 'Tender #',
        cell: ({ row }) => (
          <Link to={`/tenders/${row.original.id}`} className="font-medium text-teal hover:underline">
            {String(row.original.tenderNumber)}
          </Link>
        ),
      },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'departmentName', header: 'Department' },
      { accessorKey: 'submissionDeadline', header: 'Deadline', cell: ({ getValue }) => <span className="tabular-nums text-text-secondary">{getValue() ? formatDate(String(getValue())) : '—'}</span> },
      { accessorKey: 'stage', header: 'Stage', cell: ({ getValue }) => <StatusBadge status={String(getValue())} /> },
      {
        accessorKey: 'estimatedValue',
        header: 'Est. value',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.estimatedValue != null
              ? formatCurrency(row.original.estimatedValue, row.original.currency)
              : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Tenders"
        description="Public procurement opportunities and submission pipeline."
        actions={
          <PermissionGuard permission="tenders:create">
            <Button asChild variant="teal">
              <Link to="/tenders/new">
                <Plus className="h-4 w-4" />
                New tender
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search…"
          className="w-full sm:max-w-sm"
        />
        <select
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
          value={state.filters.stage ?? ''}
          onChange={(e) =>
            setState({ filters: { ...state.filters, stage: e.target.value }, page: 1 })
          }
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          <option value="identified">Identified</option>
          <option value="under_review">Under review</option>
          <option value="preparing">Preparing</option>
          <option value="submitted">Submitted</option>
          <option value="awarded">Awarded</option>
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
        emptyTitle="No records found"
        emptyDescription="Adjust filters or create a new record to get started."
      />
    </div>
  )
}

export default TendersListPage
