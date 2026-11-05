import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app-bg p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-navy">
        <MapPinOff className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-text-secondary">404</p>
        <h1 className="text-2xl font-semibold text-navy">Page not found</h1>
        <p className="max-w-md text-sm text-text-secondary">
          The page you requested does not exist or may have been moved.
        </p>
      </div>
      <Button asChild variant="teal">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}
