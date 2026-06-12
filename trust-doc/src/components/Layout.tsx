import { useEffect, useState } from 'react'
import { useStore, type Page } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Settings as SettingsIcon,
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  id: Page
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documentation', label: 'Documentation', icon: FolderKanban },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function useTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(dark ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }, [theme])
}

export function Layout({
  page,
  onNavigate,
  children,
}: {
  page: Page
  onNavigate: (p: Page) => void
  children: React.ReactNode
}) {
  const orgName = useStore((s) => s.settings.orgName)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-lg shadow-primary/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight">Trust Doc</div>
            <div className="text-[11px] text-muted-foreground">IT Documentation</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </div>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  setMobileOpen(false)
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', active && 'text-primary')} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <div className="text-xs font-semibold">{orgName}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Agentic documentation workspace</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold capitalize">
              {NAV.find((n) => n.id === page)?.label}
            </h1>
          </div>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
