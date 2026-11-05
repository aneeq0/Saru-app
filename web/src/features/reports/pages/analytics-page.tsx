import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function AnalyticsPage() {
  return (
    <SimpleResourceListPage
      title="Analytics"
      description="Operational KPIs across imports, tenders, inventory, and receivables."
      endpoint="/analytics/summary"
      queryKey="analytics"
      defaultSortId="metric"
      searchPlaceholder="Search metrics…"
      columns={[
        { key: 'metric', header: 'Metric' },
        { key: 'period', header: 'Period' },
        { key: 'value', header: 'Value', type: 'number' },
        { key: 'unit', header: 'Unit' },
        { key: 'trend', header: 'Trend', type: 'status' },
        { key: 'note', header: 'Note' },
      ]}
    />
  )
}
