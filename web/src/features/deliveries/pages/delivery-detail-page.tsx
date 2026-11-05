import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useDelivery } from '../hooks/use-deliveries'

export function DeliveryDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useDelivery(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.deliveryNumber} description={String(data.departmentName)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Contract" value={String(data.contractNumber)} />
            <Field label="Destination" value={String(data.destination)} />
            <Field label="Scheduled" value={String(formatDate(data.scheduledDate))} />
            <Field label="Dispatched" value={String(data.dispatchDate ? formatDate(data.dispatchDate) : "—")} />
            <Field label="Challan" value={String(data.challanNumber ?? "—")} />
            <Field label="Items" value={String(String(data.itemCount))} />
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

export default DeliveryDetailPage
