import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function ComplianceListPage() {
  return (
    <SimpleResourceListPage
      title="Tender compliance"
      description="Mandatory documents and checklist items before bid submission."
      endpoint="/tenders/compliance"
      queryKey="compliance"
      searchPlaceholder="Search compliance items…"
      statusFilterOptions={[
        { value: 'open', label: 'Open' },
        { value: 'complete', label: 'Complete' },
        { value: 'overdue', label: 'Overdue' },
      ]}
      columns={[
        { key: 'tenderNumber', header: 'Tender' },
        { key: 'code', header: 'Code' },
        { key: 'title', header: 'Requirement' },
        { key: 'required', header: 'Required', type: 'boolean' },
        { key: 'completed', header: 'Done', type: 'boolean' },
        { key: 'dueDate', header: 'Due', type: 'date' },
        { key: 'status', header: 'Status', type: 'status' },
      ]}
    />
  )
}
