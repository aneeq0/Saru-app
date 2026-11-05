import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function RolesListPage() {
  return (
    <SimpleResourceListPage
      title="Roles & permissions"
      description="System roles available in the demonstration portal."
      endpoint="/settings/roles"
      queryKey="roles"
      defaultSortId="name"
      searchPlaceholder="Search roles…"
      columns={[
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
        { key: 'userCount', header: 'Users', type: 'number' },
        { key: 'permissionCount', header: 'Permissions', type: 'number' },
        { key: 'isSystem', header: 'System', type: 'boolean' },
      ]}
    />
  )
}
