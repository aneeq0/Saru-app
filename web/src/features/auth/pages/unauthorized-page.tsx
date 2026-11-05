import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface UnauthorizedPageProps {
  embedded?: boolean
}

export function UnauthorizedPage({ embedded = false }: UnauthorizedPageProps) {
  const content = (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldX className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy">Access denied</h1>
        <p className="max-w-md text-sm text-text-secondary">
          You do not have permission to view this page. Contact your administrator if you believe
          this is an error.
        </p>
      </div>
      <Button asChild variant="teal">
        <Link to="/dashboard">Return to dashboard</Link>
      </Button>
    </div>
  )

  if (embedded) {
    return <div className="flex min-h-[50vh] items-center justify-center p-8">{content}</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg p-6">{content}</div>
  )
}
