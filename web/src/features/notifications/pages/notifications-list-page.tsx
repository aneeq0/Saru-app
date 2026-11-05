import { useMemo } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate } from '@/lib/format'
import type { AppNotification } from '@/types/entities'
import { useNotificationsList } from '../hooks/use-notifications'

export function NotificationsListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'createdAt', desc: true }] })
  const query = useNotificationsList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc'
  })

  const columns = useMemo<ColumnDef<AppNotification>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'priority', header: 'Priority', cell: ({ getValue }) => <StatusBadge status={String(getValue())} /> },
      { accessorKey: 'read', header: 'Read', cell: ({ getValue }) => (getValue() ? 'Yes' : 'No') },
      { accessorKey: 'createdAt', header: 'Received', cell: ({ getValue }) => <span className="tabular-nums text-text-secondary">{getValue() ? formatDate(String(getValue())) : '—'}</span> },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System alerts and workflow notifications for your account."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search…"
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
        emptyTitle="No records found"
        emptyDescription="Adjust filters or create a new record to get started."
      />
    </div>
  )
}

export default NotificationsListPage
