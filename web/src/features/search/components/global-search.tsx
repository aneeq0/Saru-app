import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useShell } from '@/app/layouts/shell-context'
import { FLAT_NAV_ITEMS } from '@/app/layouts/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useShell()
  const { canViewModule } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const items = useMemo(
    () => FLAT_NAV_ITEMS.filter((item) => canViewModule(item.module)),
    [canViewModule],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setSearchOpen])

  useEffect(() => {
    if (!searchOpen) setQuery('')
  }, [searchOpen])

  function go(path: string) {
    setSearchOpen(false)
    navigate(path)
  }

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command className="rounded-xl bg-surface" shouldFilter>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-text-secondary" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search modules, pages…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-text-secondary"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-text-secondary sm:inline">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-text-secondary">
              No matching pages.
            </Command.Empty>
            <Command.Group heading="Navigation">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Command.Item
                    key={item.path}
                    value={[item.title, item.path, ...(item.keywords ?? [])].join(' ')}
                    onSelect={() => go(item.path)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-muted',
                    )}
                  >
                    <Icon className="size-4 text-teal" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy">{item.title}</p>
                      <p className="truncate text-xs text-text-secondary">{item.path}</p>
                    </div>
                  </Command.Item>
                )
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
