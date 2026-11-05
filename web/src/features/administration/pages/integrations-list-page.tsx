import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function IntegrationsListPage() {
  return (
    <SimpleResourceListPage
      title="Integrations"
      description="External systems connected to the Saru demo portal."
      endpoint="/settings/integrations"
      queryKey="integrations"
      searchPlaceholder="Search integrations…"
      statusFilterOptions={[
        { value: 'connected', label: 'Connected' },
        { value: 'disconnected', label: 'Disconnected' },
        { value: 'error', label: 'Error' },
        { value: 'pending', label: 'Pending' },
      ]}
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'provider', header: 'Provider' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'lastSyncAt', header: 'Last sync', type: 'date' },
        { key: 'notes', header: 'Notes' },
      ]}
    />
  )
}
