import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function TemplatesListPage() {
  return (
    <SimpleResourceListPage
      title="Document templates"
      description="Reusable templates for bids, challans, invoices, and QC reports."
      endpoint="/documents/templates"
      queryKey="templates"
      searchPlaceholder="Search templates…"
      statusFilterOptions={[
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'inactive', label: 'Inactive' },
      ]}
      columns={[
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Name' },
        { key: 'documentType', header: 'Type' },
        { key: 'versionLabel', header: 'Version' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'updatedAt', header: 'Updated', type: 'date' },
      ]}
    />
  )
}
