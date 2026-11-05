import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import type { Employee } from '@/types/entities'
import { useEmployeesList } from '../hooks/use-employees'

export function EmployeesListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'updatedAt', desc: true }] })
  const query = useEmployeesList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
    status: state.filters.status
  })

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'employeeCode',
        header: 'Code',
        cell: ({ row }) => (
          <Link to={`/admin/employees/${row.original.id}`} className="font-medium text-teal hover:underline">
            {String(row.original.employeeCode)}
          </Link>
        ),
      },
      { accessorKey: 'firstName', header: 'First name' },
      { accessorKey: 'lastName', header: 'Last name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={String(getValue())} /> },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Portal users, roles, and access status."
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
        emptyTitle="No records found"
        emptyDescription="Adjust filters or create a new record to get started."
      />
    </div>
  )
}

export default EmployeesListPage
