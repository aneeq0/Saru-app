import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error?: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  error,
  title = 'Unable to load data',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-[10px] border border-danger/20 bg-danger/5 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="mb-3 h-6 w-6 text-danger" aria-hidden />
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-text-secondary">{getUserFacingErrorMessage(error)}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
