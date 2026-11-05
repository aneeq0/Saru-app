import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function ReceiptsListPage() {
  return (
    <SimpleResourceListPage
      title="Goods receipts"
      description="GRN records against import shipments and warehouse receiving."
      endpoint="/inventory/receipts"
      queryKey="receipts"
      searchPlaceholder="Search receipts…"
      statusFilterOptions={[
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'posted', label: 'Posted' },
        { value: 'rejected', label: 'Rejected' },
      ]}
      columns={[
        { key: 'reference', header: 'GRN' },
        { key: 'shipmentReference', header: 'Shipment' },
        { key: 'warehouseName', header: 'Warehouse' },
        { key: 'receivedQty', header: 'Received', type: 'number' },
        { key: 'acceptedQty', header: 'Accepted', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'receivedAt', header: 'Received', type: 'date' },
      ]}
    />
  )
}
