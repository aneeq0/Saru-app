import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function TransfersListPage() {
  return (
    <SimpleResourceListPage
      title="Stock transfers"
      description="Inter-warehouse transfers for redistribution and cold-chain moves."
      endpoint="/inventory/transfers"
      queryKey="transfers"
      searchPlaceholder="Search transfers…"
      statusFilterOptions={[
        { value: 'draft', label: 'Draft' },
        { value: 'in_transit', label: 'In transit' },
        { value: 'received', label: 'Received' },
        { value: 'cancelled', label: 'Cancelled' },
      ]}
      columns={[
        { key: 'reference', header: 'Reference' },
        { key: 'fromWarehouse', header: 'From' },
        { key: 'toWarehouse', header: 'To' },
        { key: 'lineCount', header: 'Lines', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'shippedAt', header: 'Shipped', type: 'date' },
      ]}
    />
  )
}
