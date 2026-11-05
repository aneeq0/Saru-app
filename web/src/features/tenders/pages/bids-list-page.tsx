import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function BidsListPage() {
  return (
    <SimpleResourceListPage
      title="Bids"
      description="Submitted and in-progress bids linked to government tenders."
      endpoint="/tenders/bids"
      queryKey="bids"
      searchPlaceholder="Search bids…"
      statusFilterOptions={[
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'under_evaluation', label: 'Under evaluation' },
        { value: 'won', label: 'Won' },
        { value: 'lost', label: 'Lost' },
      ]}
      columns={[
        { key: 'reference', header: 'Bid' },
        { key: 'tenderNumber', header: 'Tender' },
        { key: 'tenderTitle', header: 'Title' },
        { key: 'totalAmount', header: 'Amount', type: 'money' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'submittedAt', header: 'Submitted', type: 'date' },
      ]}
    />
  )
}
