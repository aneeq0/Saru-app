import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layouts/sidebar'
import { TopHeader } from '@/app/layouts/top-header'
import { ShellProvider } from '@/app/layouts/shell-context'
import { GlobalSearch } from '@/features/search/components/global-search'

export function AppShell() {
  return (
    <ShellProvider>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-app-bg">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1600px] min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <GlobalSearch />
    </ShellProvider>
  )
}
