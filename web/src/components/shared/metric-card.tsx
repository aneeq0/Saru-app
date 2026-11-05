import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  trend?: { label: string; positive?: boolean }
  className?: string
}

export function MetricCard({ label, value, hint, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-navy">{value}</p>
            {hint ? <p className="mt-1 text-xs text-text-secondary">{hint}</p> : null}
            {trend ? (
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  trend.positive === false ? 'text-danger' : 'text-success',
                )}
              >
                {trend.label}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div className="rounded-lg bg-muted p-2 text-teal">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
