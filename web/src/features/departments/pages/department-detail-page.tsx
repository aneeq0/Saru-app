import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useDepartment } from '../hooks/use-departments'

export function DepartmentDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useDepartment(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.name} description={String(data.code)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" value={String(data.code)} />
            <Field label="Name" value={String(data.name)} />
            <Field label="Type" value={String(data.type)} />
            <Field label="City" value={String(data.city ?? "—")} />
            <Field label="Province" value={String(data.province ?? "—")} />
            <Field label="Contact" value={String(data.contactName ?? "—")} />
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

export default DepartmentDetailPage
