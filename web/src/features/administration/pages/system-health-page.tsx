import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useSystemHealth } from '../hooks/use-admin'

export function SystemHealthPage() {
  const query = useSystemHealth()

  if (query.isLoading) return <LoadingSkeleton rows={6} />
  if (query.isError || !query.data) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }

  const data = query.data

  return (
    <div>
      <PageHeader title="System health" description="Service availability and latency snapshot." />
      <div className="mb-4">
        <StatusBadge status={data.status} />
        <p className="mt-2 text-sm text-text-secondary">
          Checked {formatDate(data.checkedAt)} · Version {data.version}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.services.map((service) => (
          <Card key={service.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base capitalize">{service.name}</CardTitle>
              <StatusBadge status={service.status} />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Latency: {service.latencyMs != null ? `${service.latencyMs} ms` : '—'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SystemHealthPage
