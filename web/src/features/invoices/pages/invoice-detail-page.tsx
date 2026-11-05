import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { PermissionGuard } from '@/components/shared/permission-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { useFinalizeInvoice, useInvoice } from '../hooks/use-invoices'

export function InvoiceDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useInvoice(id)
  const finalize = useFinalizeInvoice(id)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  const canFinalize = data.status === 'draft' || data.status === 'pending_approval'

  const handleFinalize = async () => {
    try {
      await finalize.mutateAsync()
      toast.success('Invoice finalized and issued.')
      setConfirmOpen(false)
    } catch (err) {
      toast.error(getUserFacingErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title={data.invoiceNumber}
        description={data.departmentName}
        actions={
          canFinalize ? (
            <PermissionGuard permission="invoices:finalize">
              <Button variant="teal" onClick={() => setConfirmOpen(true)}>
                Finalize invoice
              </Button>
            </PermissionGuard>
          ) : null
        }
      />
      <div className="mb-4">
        <StatusBadge status={data.status} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Billing summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Invoice date" value={formatDate(data.invoiceDate)} />
          <Field label="Due date" value={data.dueDate ? formatDate(data.dueDate) : '—'} />
          <Field label="Subtotal" value={formatCurrency(data.subtotal, data.currency)} />
          <Field label="Tax" value={formatCurrency(data.taxTotal, data.currency)} />
          <Field label="Grand total" value={formatCurrency(data.grandTotal, data.currency)} />
          <Field label="Amount paid" value={formatCurrency(data.amountPaid, data.currency)} />
          <Field label="Balance due" value={formatCurrency(data.balanceDue, data.currency)} />
          <Field label="Contract" value={data.contractNumber ?? '—'} />
          <Field label="Last updated" value={formatDate(data.updatedAt)} />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Finalize invoice?"
        description="This will issue the invoice and make it available for payment allocation. This action cannot be undone in the demo environment."
        confirmLabel="Finalize"
        loading={finalize.isPending}
        onConfirm={handleFinalize}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  )
}

export default InvoiceDetailPage
