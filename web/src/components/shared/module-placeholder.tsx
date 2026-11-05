import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'

interface ModulePlaceholderProps {
  title: string
  description?: string
  status?: 'implemented' | 'configured' | 'planned'
}

export function ModulePlaceholder(props: ModulePlaceholderProps) {
  return <ModulePlaceholderPage {...props} />
}

export function ModulePlaceholderPage({
  title,
  description = 'This module is wired for navigation and permissions. Full workflow UI and backend integration are in progress.',
  status = 'planned',
}: ModulePlaceholderProps) {
  const statusLabel =
    status === 'implemented'
      ? 'Implemented'
      : status === 'configured'
        ? 'Configured — backend unavailable'
        : 'Planned / feature-flagged'

  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-8">
          <div className="rounded-lg bg-muted p-3 text-text-secondary">
            <Construction className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-base font-medium text-navy">Backend integration pending</p>
          <p className="max-w-2xl text-sm text-text-secondary">
            {description} Module in progress — navigation and permissions are active.
          </p>
          <p className="text-xs text-text-secondary">Status: {statusLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}
