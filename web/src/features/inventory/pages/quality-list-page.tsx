import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function QualityListPage() {
  return (
    <SimpleResourceListPage
      title="Quality control"
      description="Incoming inspection, quarantine, and release decisions."
      endpoint="/inventory/quality"
      queryKey="quality"
      searchPlaceholder="Search QC records…"
      statusFilterOptions={[
        { value: 'pending', label: 'Pending' },
        { value: 'passed', label: 'Passed' },
        { value: 'failed', label: 'Failed' },
        { value: 'quarantined', label: 'Quarantined' },
        { value: 'released', label: 'Released' },
      ]}
      columns={[
        { key: 'reference', header: 'Reference' },
        { key: 'sku', header: 'SKU' },
        { key: 'productName', header: 'Product' },
        { key: 'warehouseName', header: 'Warehouse' },
        { key: 'acceptedQty', header: 'Accepted', type: 'number' },
        { key: 'rejectedQty', header: 'Rejected', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'inspectedAt', header: 'Inspected', type: 'date' },
      ]}
    />
  )
}
