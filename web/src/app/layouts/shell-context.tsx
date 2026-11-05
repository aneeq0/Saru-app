import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface ShellContextValue {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  toggleSidebarCollapsed: () => void
  mobileNavOpen: boolean
  setMobileNavOpen: (value: boolean) => void
  toggleMobileNav: () => void
  searchOpen: boolean
  setSearchOpen: (value: boolean) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

function getInitialCollapsed() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 1279px)').matches
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOverride, setUserOverride] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    const onChange = (event: MediaQueryListEvent) => {
      setMobileNavOpen(false)
      if (!userOverride) {
        setSidebarCollapsed(event.matches)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [userOverride])

  const value = useMemo<ShellContextValue>(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed: (next) => {
        setUserOverride(true)
        setSidebarCollapsed(next)
      },
      toggleSidebarCollapsed: () => {
        setUserOverride(true)
        setSidebarCollapsed((v) => !v)
      },
      mobileNavOpen,
      setMobileNavOpen,
      toggleMobileNav: () => setMobileNavOpen((v) => !v),
      searchOpen,
      setSearchOpen,
    }),
    [mobileNavOpen, searchOpen, sidebarCollapsed],
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within ShellProvider')
  return ctx
}
