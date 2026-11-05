import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function ReservationsListPage() {
  return (
    <SimpleResourceListPage
      title="Stock reservations"
      description="Quantities reserved for tenders, contracts, and deliveries."
      endpoint="/inventory/reservations"
      queryKey="reservations"
      searchPlaceholder="Search reservations…"
      statusFilterOptions={[
        { value: 'active', label: 'Active' },
        { value: 'released', label: 'Released' },
        { value: 'consumed', label: 'Consumed' },
        { value: 'expired', label: 'Expired' },
      ]}
      columns={[
        { key: 'sku', header: 'SKU' },
        { key: 'productName', header: 'Product' },
        { key: 'warehouseName', header: 'Warehouse' },
        { key: 'quantity', header: 'Qty', type: 'number' },
        { key: 'sourceType', header: 'Source' },
        { key: 'sourceReference', header: 'Reference' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'expiresAt', header: 'Expires', type: 'date' },
      ]}
    />
  )
}
