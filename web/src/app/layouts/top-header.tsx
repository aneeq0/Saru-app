import { Link, useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  ClipboardCheck,
  Menu,
  Search,
  User,
} from 'lucide-react'
import { findNavItemByPath } from '@/app/layouts/navigation'
import { useShell } from '@/app/layouts/shell-context'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useRealtimeConnectionStatus } from '@/services/realtime/RealtimeProvider'

function breadcrumbLabel(pathname: string) {
  const match = findNavItemByPath(pathname)
  if (match) return match.title
  if (pathname.includes('/:')) return 'Detail'
  const segment = pathname.split('/').filter(Boolean).pop()
  return segment ? segment.replace(/-/g, ' ') : 'Home'
}

export function TopHeader() {
  const location = useLocation()
  const { organization, user, logout, canViewModule } = useAuth()
  const { toggleMobileNav, setSearchOpen } = useShell()
  const { status: realtimeStatus } = useRealtimeConnectionStatus()

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.length
    ? segments.map((_, index) => `/${segments.slice(0, index + 1).join('/')}`)
    : ['/dashboard']

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:gap-3 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={toggleMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1 text-sm sm:flex">
        {crumbs.map((path, index) => {
          const isLast = index === crumbs.length - 1
          const label = breadcrumbLabel(path)
          return (
            <span key={path} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-text-secondary" /> : null}
              {isLast ? (
                <span className="truncate font-medium capitalize text-navy">{label}</span>
              ) : (
                <Link to={path} className="truncate capitalize text-text-secondary hover:text-navy">
                  {label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      <p className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-navy sm:hidden">
        {breadcrumbLabel(location.pathname)}
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden gap-2 text-text-secondary lg:inline-flex"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          <span>Search</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>

        {organization ? (
          <span className="hidden max-w-[10rem] truncate text-xs font-medium text-text-secondary xl:inline">
            {organization.shortName || organization.name}
          </span>
        ) : null}

        {canViewModule('approvals') ? (
          <Button asChild variant="ghost" size="sm" className="hidden gap-1.5 md:inline-flex">
            <Link to="/approvals">
              <ClipboardCheck className="size-4 text-amber" />
              <span className="text-xs">Approvals</span>
              <Badge variant="outline" className="border-amber/40 bg-amber/10 text-amber">
                Inbox
              </Badge>
            </Link>
          </Button>
        ) : null}

        {canViewModule('approvals') ? (
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Approvals">
            <Link to="/approvals">
              <ClipboardCheck className="size-4 text-amber" />
            </Link>
          </Button>
        ) : null}

        {realtimeStatus === 'reconnecting' || realtimeStatus === 'offline' ? (
          <span
            className="hidden text-[10px] uppercase tracking-wide text-text-secondary sm:inline"
            title="Live sync status"
          >
            {realtimeStatus}
          </span>
        ) : null}

        {canViewModule('notifications') ? (
          <Button asChild variant="ghost" size="icon" aria-label="Notifications">
            <Link to="/notifications">
              <Bell className="size-4" />
            </Link>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pl-1 pr-1 sm:pr-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-navy text-xs text-white">
                  {user?.displayName
                    ?.split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[8rem] truncate text-sm lg:inline">{user?.displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs font-normal text-text-secondary">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <User className="size-4" />
                Profile & settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
