import { FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReportCatalog } from '../hooks/use-reports'

export function ReportsCatalogPage() {
  const query = useReportCatalog()

  if (query.isLoading) return <LoadingSkeleton rows={6} />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />

  const reports = query.data?.data ?? []

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export catalog for operational, financial, and compliance reporting."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="rounded-lg bg-muted p-2 text-teal">
                <FileSpreadsheet className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">{report.name}</CardTitle>
                <p className="mt-1 text-sm text-text-secondary">{report.description}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Module: {report.module} · Formats: {report.formats.join(', ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ReportsCatalogPage
