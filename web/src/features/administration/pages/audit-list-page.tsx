import { useMemo } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate } from '@/lib/format'
import type { AuditLogEntry } from '@/types/entities'
import { useAuditLogList } from '../hooks/use-admin'

export function AuditListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'timestamp', desc: true }] })
  const query = useAuditLogList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
  })

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Time',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">{formatDate(String(getValue()))}</span>
        ),
      },
      { accessorKey: 'user', header: 'User' },
      { accessorKey: 'action', header: 'Action' },
      { accessorKey: 'module', header: 'Module' },
      { accessorKey: 'recordReference', header: 'Record' },
      {
        accessorKey: 'result',
        header: 'Result',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader title="Audit log" description="User activity and system events for compliance review." />
      <div className="mb-4">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search user, action, or module…"
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
        emptyTitle="No audit entries"
        emptyDescription="Activity will be recorded as users interact with the portal."
      />
    </div>
  )
}

export default AuditListPage
