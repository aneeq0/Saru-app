import { SimpleResourceListPage } from '@/features/shared/simple-resource-list-page'

export default function CategoriesListPage() {
  return (
    <SimpleResourceListPage
      title="Categories"
      description="Product categories used across catalog, inventory, and imports."
      endpoint="/categories"
      queryKey="categories"
      defaultSortId="name"
      searchPlaceholder="Search categories…"
      statusFilterOptions={[
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'draft', label: 'Draft' },
      ]}
      columns={[
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Name' },
        { key: 'parentName', header: 'Parent' },
        { key: 'productCount', header: 'Products', type: 'number' },
        { key: 'status', header: 'Status', type: 'status' },
        { key: 'updatedAt', header: 'Updated', type: 'date' },
      ]}
    />
  )
}
