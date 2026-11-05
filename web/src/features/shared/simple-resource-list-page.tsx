import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatCurrency, formatDate } from '@/lib/format'
import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'

export type SimpleColumn =
  | { key: string; header: string; type?: 'text' }
  | { key: string; header: string; type: 'status' }
  | { key: string; header: string; type: 'date' }
  | { key: string; header: string; type: 'money'; currencyKey?: string }
  | { key: string; header: string; type: 'boolean' }
  | { key: string; header: string; type: 'number' }

interface SimpleResourceListPageProps {
  title: string
  description: string
  endpoint: string
  queryKey: string
  columns: SimpleColumn[]
  searchPlaceholder?: string
  statusFilterOptions?: { value: string; label: string }[]
  defaultSortId?: string
}

function listResource<T>(
  endpoint: string,
  params: PaginatedRequest & { status?: string },
  signal?: AbortSignal,
) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<T>>(`${endpoint}?${q.toString()}`, { signal })
}

function cellValue(row: Record<string, unknown>, key: string): unknown {
  return row[key]
}

export function SimpleResourceListPage({
  title,
  description,
  endpoint,
  queryKey,
  columns: columnDefs,
  searchPlaceholder = 'Search…',
  statusFilterOptions,
  defaultSortId = 'updatedAt',
}: SimpleResourceListPageProps) {
  const { state, setState } = useUrlTableState({
    pageSize: 20,
    sorting: [{ id: defaultSortId, desc: true }],
  })

  const query = useQuery({
    queryKey: [
      queryKey,
      'list',
      state.page,
      state.pageSize,
      state.search,
      state.sorting,
      state.filters.status,
    ],
    queryFn: ({ signal }) =>
      listResource<Record<string, unknown>>(
        endpoint,
        {
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
          sortBy: state.sorting[0]?.id,
          sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
          status: state.filters.status,
        },
        signal,
      ),
    placeholderData: (prev) => prev,
  })

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columnDefs.map((col) => ({
        accessorKey: col.key,
        header: col.header,
        cell: ({ row }) => {
          const value = cellValue(row.original, col.key)
          if (col.type === 'status') {
            return <StatusBadge status={String(value ?? '')} />
          }
          if (col.type === 'date') {
            return (
              <span className="tabular-nums text-text-secondary">
                {value ? formatDate(String(value)) : '—'}
              </span>
            )
          }
          if (col.type === 'money') {
            const currency = String(cellValue(row.original, col.currencyKey ?? 'currency') ?? 'PKR')
            return (
              <span className="tabular-nums">
                {value == null ? '—' : formatCurrency(Number(value), currency)}
              </span>
            )
          }
          if (col.type === 'boolean') {
            return value ? 'Yes' : 'No'
          }
          if (col.type === 'number') {
            return <span className="tabular-nums">{value == null ? '—' : String(value)}</span>
          }
          return value == null || value === '' ? '—' : String(value)
        },
      })),
    [columnDefs],
  )

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder={searchPlaceholder}
          className="w-full sm:max-w-sm"
        />
        {statusFilterOptions ? (
          <select
            className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
            value={state.filters.status ?? ''}
            onChange={(e) =>
              setState({ filters: { ...state.filters, status: e.target.value }, page: 1 })
            }
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : null}
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
        getRowId={(row) => String(row.id)}
        emptyTitle="No records found"
        emptyDescription="Adjust filters or create a new record to get started."
      />
    </div>
  )
}
