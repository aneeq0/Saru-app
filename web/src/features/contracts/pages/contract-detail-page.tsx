import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { useContract } from '../hooks/use-contracts'

export function ContractDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useContract(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.contractNumber} description={String(data.departmentName)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Tender" value={String(data.tenderNumber)} />
            <Field label="Awarded value" value={String(formatCurrency(data.awardedValue, data.currency))} />
            <Field label="Fulfilled value" value={String(formatCurrency(data.fulfilledValue, data.currency))} />
            <Field label="Start date" value={String(formatDate(data.startDate))} />
            <Field label="End date" value={String(data.endDate ? formatDate(data.endDate) : "—")} />
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

export default ContractDetailPage
