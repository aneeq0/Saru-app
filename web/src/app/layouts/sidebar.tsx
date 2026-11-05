import { NavLink, useLocation } from 'react-router-dom'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { useState } from 'react'
import { NAV_GROUPS } from '@/app/layouts/navigation'
import { useShell } from '@/app/layouts/shell-context'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { env } from '@/app/config/env'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function userInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface SidebarNavProps {
  collapsed: boolean
  onNavigate?: () => void
}

function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { canViewModule } = useAuth()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true])),
  )

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => canViewModule(item.module))
        if (visibleItems.length === 0) return null

        const groupActive = visibleItems.some(
          (item) =>
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
        )

        if (collapsed) {
          return (
            <div key={group.id} className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.title}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex size-10 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white',
                        (isActive || location.pathname.startsWith(`${item.path}/`)) &&
                          'bg-teal/20 text-white',
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">{item.title}</span>
                  </NavLink>
                )
              })}
            </div>
          )
        }

        return (
          <Collapsible.Root
            key={group.id}
            open={openGroups[group.id] ?? true}
            onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.id]: open }))}
          >
            <Collapsible.Trigger className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-white/45 hover:text-white/70">
              <span>{group.label}</span>
              <ChevronDown
                className={cn(
                  'size-3 transition-transform',
                  (openGroups[group.id] ?? true) ? 'rotate-0' : '-rotate-90',
                )}
              />
            </Collapsible.Trigger>
            <Collapsible.Content className="mt-1 space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white',
                        (isActive || location.pathname.startsWith(`${item.path}/`)) &&
                          'bg-teal/15 font-medium text-white',
                        groupActive && !isActive && 'text-white/65',
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                )
              })}
            </Collapsible.Content>
          </Collapsible.Root>
        )
      })}
    </nav>
  )
}

function SidebarPanel({
  collapsed,
  mobile,
  onNavigate,
}: {
  collapsed: boolean
  mobile?: boolean
  onNavigate?: () => void
}) {
  const { user, logout, isLoggingOut } = useAuth()
  const { toggleSidebarCollapsed } = useShell()

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-sidebar text-white',
        collapsed && !mobile ? 'w-[4.5rem]' : 'w-64',
        mobile && 'w-full max-w-[18rem]',
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 py-4', collapsed && !mobile && 'justify-center px-2')}>
        {!collapsed || mobile ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{env.appName}</p>
            <p className="text-xs text-white/60">Admin Portal</p>
          </div>
        ) : (
          <span className="text-xs font-bold text-teal">SI</span>
        )}
        {!mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={toggleSidebarCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        ) : null}
      </div>

      <Separator className="bg-white/10" />

      <SidebarNav collapsed={Boolean(collapsed && !mobile)} onNavigate={onNavigate} />

      <div className="mt-auto border-t border-white/10 p-3">
        {user ? (
          <div className={cn('flex items-center gap-2', collapsed && !mobile && 'flex-col')}>
            <Avatar className="size-9 border border-white/20">
              <AvatarFallback className="bg-teal/30 text-xs text-white">
                {userInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            {(!collapsed || mobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.displayName}</p>
                <p className="truncate text-xs text-white/55">{user.roleLabel}</p>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              disabled={isLoggingOut}
              onClick={() => void logout()}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useShell()

  return (
    <>
      <aside className="hidden h-full shrink-0 border-r border-white/5 md:block">
        <SidebarPanel collapsed={sidebarCollapsed} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex h-full w-[min(18rem,88vw)] max-w-full shadow-xl">
            <SidebarPanel
              collapsed={false}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 text-white hover:bg-white/10"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
