import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { useTender } from '../hooks/use-tenders'

export function TenderDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useTender(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.title} description={String(data.tenderNumber)} />
      <div className="mb-4">
        <StatusBadge status={String(data.stage)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" value={String(data.departmentName)} />
            <Field label="Procurement authority" value={String(data.procurementAuthority ?? "—")} />
            <Field label="Submission deadline" value={String(formatDate(data.submissionDeadline))} />
            <Field label="Opening date" value={String(data.openingDate ? formatDate(data.openingDate) : "—")} />
            <Field label="Estimated value" value={String(data.estimatedValue != null ? formatCurrency(data.estimatedValue, data.currency) : "—")} />
            <Field label="Missing documents" value={String(String(data.missingDocuments ?? 0))} />
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

export default TenderDetailPage
