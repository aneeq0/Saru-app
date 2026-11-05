import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { useCreateTender } from '../hooks/use-tenders'
import { tenderFormSchema, type TenderFormValues } from '../schemas/tender-schema'

export function TenderFormPage() {
  const navigate = useNavigate()
  const createMutation = useCreateTender()
  const form = useForm<TenderFormValues>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: {
      tenderNumber: '',
      title: '',
      departmentName: '',
      procurementAuthority: '',
      submissionDeadline: '',
      currency: 'PKR',
      estimatedValue: undefined,
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync({
        ...values,
        stage: 'identified',
        estimatedValue: values.estimatedValue,
      })
      toast.success('Tender created.')
      navigate(`/tenders/${created.id}`)
    } catch (err) {
      toast.error(getUserFacingErrorMessage(err))
    }
  })

  return (
    <div>
      <PageHeader title="New tender" description="Capture a procurement opportunity for pipeline tracking." />
      <Card>
        <CardContent className="pt-6">
          <form className="grid max-w-xl gap-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="tenderNumber">Tender number</Label>
              <Input id="tenderNumber" {...form.register('tenderNumber')} />
              {form.formState.errors.tenderNumber ? (
                <p className="text-sm text-danger">{form.formState.errors.tenderNumber.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title ? (
                <p className="text-sm text-danger">{form.formState.errors.title.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department</Label>
              <Input id="departmentName" {...form.register('departmentName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procurementAuthority">Procurement authority</Label>
              <Input id="procurementAuthority" {...form.register('procurementAuthority')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submissionDeadline">Submission deadline</Label>
              <Input id="submissionDeadline" type="datetime-local" {...form.register('submissionDeadline')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...form.register('currency')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated value</Label>
                <Input id="estimatedValue" type="number" step="0.01" {...form.register('estimatedValue')} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="teal" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Create tender'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tenders')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TenderFormPage
