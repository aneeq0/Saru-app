import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function StockCountsListPage() {
  return (
    <SimpleResourceListPage
      title="Stock counts"
      description="Cycle counts and physical inventory sessions by warehouse."
      endpoint="/inventory/stock-counts"
      queryKey="stock-counts"
      searchPlaceholder="Search stock counts…"
      statusFilterOptions={[
        { value: 'draft', label: 'Draft' },
        { value: 'in_progress', label: 'In progress' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'posted', label: 'Posted' },
      ]}
      columns={[
        { key: 'reference', header: 'Reference' },
        { key: 'warehouseName', header: 'Warehouse' },
        { key: 'lineCount', header: 'Lines', type: 'number' },
        { key: 'varianceCount', header: 'Variances', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'countedAt', header: 'Counted', type: 'date' },
      ]}
    />
  )
}
