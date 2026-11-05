import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useCompanySettings } from '../hooks/use-admin'

export function CompanySettingsPage() {
  const query = useCompanySettings()

  if (query.isLoading) return <LoadingSkeleton rows={6} />
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }

  const data = query.data

  return (
    <div>
      <PageHeader title="Company settings" description="Organization profile and fiscal defaults." />
      <Card>
        <CardHeader>
          <CardTitle>{data.organization.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Short name" value={data.organization.shortName} />
          <Field label="Legal name" value={data.legalName} />
          <Field label="Tax registration" value={data.taxRegistration} />
          <Field label="Default currency" value={data.defaultCurrency} />
          <Field label="Fiscal year start month" value={String(data.fiscalYearStartMonth)} />
          <Field label="Timezone" value={data.timezone} />
          <Field label="Support email" value={data.supportEmail} />
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

export default CompanySettingsPage
