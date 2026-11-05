import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function NotificationConfigPage() {
  return (
    <SimpleResourceListPage
      title="Notification configuration"
      description="Event-driven alerts for deadlines, arrivals, QC holds, and approvals."
      endpoint="/settings/notification-config"
      queryKey="notification-config"
      defaultSortId="eventType"
      searchPlaceholder="Search notification events…"
      columns={[
        { key: 'eventType', header: 'Event' },
        { key: 'channel', header: 'Channel', type: 'status' },
        { key: 'audience', header: 'Audience' },
        { key: 'enabled', header: 'Enabled', type: 'boolean' },
        { key: 'updatedAt', header: 'Updated', type: 'date' },
      ]}
    />
  )
}
