import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { usePayment } from '../hooks/use-payments'

export function PaymentDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = usePayment(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.paymentReference} description={String(data.payer)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment date" value={String(formatDate(data.paymentDate))} />
            <Field label="Amount" value={String(formatCurrency(data.amount, data.currency))} />
            <Field label="Method" value={String(data.method)} />
            <Field label="Bank reference" value={String(data.bankReference ?? "—")} />
            <Field label="Allocated" value={String(formatCurrency(data.allocatedAmount, data.currency))} />
          <Field label="Last updated" value={formatDate(data.updatedAt)} />
        </CardContent>
      </Card>
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

export default PaymentDetailPage
