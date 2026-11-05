import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { PermissionGuard } from '@/components/shared/permission-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatQuantity } from '@/lib/format'
import { useProduct } from '../hooks/use-products'

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useProduct(id)

  if (isLoading) return <LoadingSkeleton rows={8} />
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader
        title={data.name}
        description={`${data.sku} · ${data.categoryName}`}
        actions={
          <PermissionGuard permission="products:edit_draft">
            <Button asChild variant="outline">
              <Link to={`/products/${data.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mb-4">
        <StatusBadge status={data.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU" value={data.sku} />
            <Field label="Manufacturer" value={data.manufacturerName} />
            <Field label="Brand" value={data.brand ?? '—'} />
            <Field label="Country of origin" value={data.countryOfOrigin ?? '—'} />
            <Field label="Packaging unit" value={data.packagingUnit} />
            <Field label="Variants" value={String(data.variantCount)} />
            <Field
              label="Available stock"
              value={formatQuantity(data.stockAvailable, data.packagingUnit)}
            />
            <Field label="Last updated" value={formatDate(data.updatedAt)} />
            <div className="sm:col-span-2">
              <Field label="Description" value={data.description || 'No description provided.'} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link className="block text-teal hover:underline" to={`/inventory/stock?q=${data.sku}`}>
              View stock balances
            </Link>
            <Link className="block text-teal hover:underline" to={`/imports?q=${data.sku}`}>
              Import history
            </Link>
            <Link className="block text-teal hover:underline" to={`/tenders?q=${data.sku}`}>
              Tender history
            </Link>
            <Link className="block text-teal hover:underline" to={`/documents?q=${data.sku}`}>
              Linked documents
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text">{value}</dd>
    </div>
  )
}

export default ProductDetailPage
