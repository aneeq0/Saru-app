import { useMemo, useState } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge } from '@/components/shared/status-badge'
import { PermissionGuard } from '@/components/shared/permission-guard'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { useUrlTableState } from '@/hooks/use-url-table-state'
import { formatDate } from '@/lib/format'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import type { ApprovalRequest } from '@/types/entities'
import { useApproveApproval, useApprovalsList, useRejectApproval } from '../hooks/use-approvals'

export function ApprovalsListPage() {
  const { state, setState } = useUrlTableState({ pageSize: 20, sorting: [{ id: 'requestedAt', desc: true }] })
  const query = useApprovalsList({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sortBy: state.sorting[0]?.id,
    sortDir: state.sorting[0]?.desc ? 'desc' : 'asc',
    status: state.filters.status,
  })
  const approve = useApproveApproval()
  const reject = useRejectApproval()
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)

  const columns = useMemo<ColumnDef<ApprovalRequest>[]>(
    () => [
      { accessorKey: 'recordReference', header: 'Reference' },
      { accessorKey: 'module', header: 'Module' },
      { accessorKey: 'requestType', header: 'Type' },
      { accessorKey: 'requester', header: 'Requester' },
      { accessorKey: 'assignedApprover', header: 'Approver' },
      {
        accessorKey: 'requestedAt',
        header: 'Requested',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-secondary">{formatDate(String(getValue()))}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          row.original.status === 'pending' ? (
            <div className="flex justify-end gap-2">
              <PermissionGuard permission="approvals:approve">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingAction({ id: row.original.id, type: 'approve' })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setPendingAction({ id: row.original.id, type: 'reject' })}
                >
                  Reject
                </Button>
              </PermissionGuard>
            </div>
          ) : null,
      },
    ],
    [],
  )

  const runAction = async () => {
    if (!pendingAction) return
    try {
      if (pendingAction.type === 'approve') {
        await approve.mutateAsync({ id: pendingAction.id })
        toast.success('Request approved.')
      } else {
        await reject.mutateAsync({ id: pendingAction.id })
        toast.success('Request rejected.')
      }
      setPendingAction(null)
    } catch (err) {
      toast.error(getUserFacingErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Multi-level approval queue for sensitive business operations."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={state.search}
          onChange={(search) => setState({ search, page: 1 })}
          placeholder="Search reference or requester…"
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
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
        emptyTitle="No approval requests"
        emptyDescription="Pending items will appear here when workflows require sign-off."
      />

      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.type === 'approve' ? 'Approve request?' : 'Reject request?'}
        description={
          pendingAction?.type === 'approve'
            ? 'Confirm approval for this workflow step.'
            : 'Rejecting will return the record to the requester.'
        }
        confirmLabel={pendingAction?.type === 'approve' ? 'Approve' : 'Reject'}
        destructive={pendingAction?.type === 'reject'}
        loading={approve.isPending || reject.isPending}
        onConfirm={runAction}
      />
    </div>
  )
}

export default ApprovalsListPage
