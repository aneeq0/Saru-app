import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ApiError, getUserFacingErrorMessage } from '@/services/api/errors'
import { useCreateProduct, useProduct, useUpdateProduct } from '../hooks/use-products'
import { productFormSchema, type ProductFormValues } from '../schemas/product-schema'

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'new'
  const navigate = useNavigate()
  const detail = useProduct(isEdit ? (id as string) : '')
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct(id ?? '')

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      categoryName: '',
      manufacturerName: '',
      brand: '',
      countryOfOrigin: '',
      packagingUnit: 'Box',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (detail.data) {
      form.reset({
        sku: detail.data.sku,
        name: detail.data.name,
        description: detail.data.description ?? '',
        categoryName: detail.data.categoryName,
        manufacturerName: detail.data.manufacturerName,
        brand: detail.data.brand ?? '',
        countryOfOrigin: detail.data.countryOfOrigin ?? '',
        packagingUnit: detail.data.packagingUnit,
        status: detail.data.status === 'archived' ? 'inactive' : detail.data.status,
      })
    }
  }, [detail.data, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && id) {
        const updated = await updateMutation.mutateAsync({
          ...values,
          categoryId: detail.data?.categoryId ?? 'cat-001',
          manufacturerId: detail.data?.manufacturerId ?? 'mfr-001',
        })
        toast.success('Product updated')
        navigate(`/products/${updated.id}`)
      } else {
        const created = await createMutation.mutateAsync({
          ...values,
          categoryId: 'cat-001',
          manufacturerId: 'mfr-001',
          variantCount: 1,
          stockAvailable: 0,
        })
        toast.success('Product created')
        navigate(`/products/${created.id}`)
      }
    } catch (error) {
      if (error instanceof ApiError && error.isValidation && error.details) {
        Object.entries(error.details).forEach(([field, messages]) => {
          form.setError(field as keyof ProductFormValues, { message: messages[0] })
        })
      }
      toast.error(getUserFacingErrorMessage(error))
    }
  })

  if (isEdit && detail.isLoading) return <LoadingSkeleton rows={8} />
  if (isEdit && detail.isError) return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        description="Catalogue master data. Duplicate SKUs are rejected by the API."
      />
      <Card>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" {...form.register('sku')} disabled={isEdit} />
                {form.formState.errors.sku ? (
                  <p className="text-xs text-danger">{form.formState.errors.sku.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  {...form.register('status')}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name ? (
                <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                {...form.register('description')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category *</Label>
                <Input id="categoryName" {...form.register('categoryName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturerName">Manufacturer *</Label>
                <Input id="manufacturerName" {...form.register('manufacturerName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...form.register('brand')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfOrigin">Country of origin</Label>
                <Input id="countryOfOrigin" {...form.register('countryOfOrigin')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingUnit">Packaging unit *</Label>
                <Input id="packagingUnit" {...form.register('packagingUnit')} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" disabled={pending}>
                {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductFormPage
