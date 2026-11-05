import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'
import { useSecurity } from '../hooks/use-securities'

export function SecurityDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useSecurity(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={data.reference} description={String(data.type)} />
      <div className="mb-4">
        <StatusBadge status={String(data.status)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Issuing bank" value={String(data.issuingBank)} />
            <Field label="Amount" value={String(formatCurrency(data.amount, data.currency))} />
            <Field label="Issue date" value={String(formatDate(data.issueDate))} />
            <Field label="Expiry date" value={String(formatDate(data.expiryDate))} />
            <Field label="Beneficiary" value={String(data.beneficiary)} />
            <Field label="Linked tender" value={String(data.linkedTenderNumber ?? "—")} />
            <Field label="Linked contract" value={String(data.linkedContractNumber ?? "—")} />
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

export default SecurityDetailPage
