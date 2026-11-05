import { useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Building2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { env } from '@/app/config/env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
  { email: 'owner@saru.demo', role: 'Owner (full access)' },
  { email: 'tender@saru.demo', role: 'Tender manager' },
  { email: 'import@saru.demo', role: 'Import manager' },
  { email: 'inventory@saru.demo', role: 'Inventory manager' },
  { email: 'accounts@saru.demo', role: 'Accounts officer' },
  { email: 'auditor@saru.demo', role: 'Auditor (read-only)' },
] as const

const DEMO_PASSWORD = 'Demo@1234'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoggingIn, isAuthenticated, status } = useAuth()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  // Require a real user — status alone can be wrong if session parse failed
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-bg p-8 text-sm text-text-secondary">
        Checking session…
      </div>
    )
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values)
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error))
    }
  }

  function fillDemo(email: string) {
    setValue('email', email, { shouldValidate: true })
    setValue('password', DEMO_PASSWORD, { shouldValidate: true })
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal/20 text-teal">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">{env.appName}</p>
              <p className="text-sm text-white/70">Admin Portal</p>
            </div>
          </div>
          <p className="mt-10 max-w-md text-sm leading-relaxed text-white/80">
            Medical supply, import operations, tender management, and inventory control — unified for
            Saru International teams.
          </p>
        </div>
        <p className="text-xs text-white/50">Secure cookie-based sessions · Role-based access</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-app-bg p-4 sm:p-8 lg:p-10">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="space-y-1 lg:hidden">
            <h1 className="text-xl font-semibold text-navy sm:text-2xl">{env.appName}</h1>
            <p className="text-sm text-text-secondary">Admin Portal sign in</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-navy">Sign in</h2>
            <p className="text-sm text-text-secondary">Use your organization credentials</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-teal hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  {...register('password')}
                />
              </div>
              {errors.password ? (
                <p className="text-xs text-danger">{errors.password.message}</p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-teal focus:ring-teal"
                {...register('rememberMe')}
              />
              Keep me signed in on this device
            </label>

            <Button type="submit" variant="teal" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <Card className="border-dashed border-teal/30 bg-teal/5">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-teal">Demo accounts</p>
              <p className="text-xs text-text-secondary">
                Password for all demo users: <span className="font-mono text-navy">{DEMO_PASSWORD}</span>
              </p>
              <ul className="space-y-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => fillDemo(account.email)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-surface"
                    >
                      <span className="font-medium text-navy">{account.email}</span>
                      <span className="text-text-secondary"> — {account.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
