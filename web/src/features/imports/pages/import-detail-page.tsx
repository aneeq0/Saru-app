import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { useImport } from '../hooks/use-imports'

export function ImportDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useImport(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.reference} description={String(data.supplierName)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Supplier" value={String(data.supplierName)} />
            <Field label="Manufacturer" value={String(data.manufacturerName ?? "—")} />
            <Field label="Shipping method" value={String(data.shippingMethod)} />
            <Field label="Expected arrival" value={String(data.expectedArrival ? formatDate(data.expectedArrival) : "—")} />
            <Field label="Actual arrival" value={String(data.actualArrival ? formatDate(data.actualArrival) : "—")} />
            <Field label="Currency" value={String(data.currency)} />
            <Field label="Exchange rate" value={String(String(data.exchangeRate))} />
            <Field label="Items" value={String(String(data.itemCount))} />
            <Field label="Total value" value={String(formatCurrency(data.totalValue, data.currency))} />
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

export default ImportDetailPage
