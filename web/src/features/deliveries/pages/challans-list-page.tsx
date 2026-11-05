import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function ChallansListPage() {
  return (
    <SimpleResourceListPage
      title="Challans"
      description="Delivery challans issued against scheduled department deliveries."
      endpoint="/deliveries/challans"
      queryKey="challans"
      searchPlaceholder="Search challans…"
      statusFilterOptions={[
        { value: 'draft', label: 'Draft' },
        { value: 'issued', label: 'Issued' },
        { value: 'dispatched', label: 'Dispatched' },
        { value: 'cancelled', label: 'Cancelled' },
      ]}
      columns={[
        { key: 'challanNumber', header: 'Challan' },
        { key: 'deliveryNumber', header: 'Delivery' },
        { key: 'departmentName', header: 'Department' },
        { key: 'itemCount', header: 'Items', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'issuedAt', header: 'Issued', type: 'date' },
      ]}
    />
  )
}
