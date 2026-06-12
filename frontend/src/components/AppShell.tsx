import { useState } from 'react'
import {
  Bot,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import type { Page } from '@/lib/navigation'

const navigation = [
  { name: 'Dashboard', hash: '', page: 'dashboard', icon: LayoutDashboard },
  { name: 'Documents', hash: 'documents', page: 'documents', icon: FileText },
  { name: 'Infrastructure', hash: 'infrastructure', page: 'infrastructure', icon: Server },
  { name: 'Agent', hash: 'agent', page: 'agent', icon: Bot },
  { name: 'Settings', hash: 'settings', page: 'settings', icon: Settings },
] as const

interface AppShellProps {
  page: Page
  children: React.ReactNode
}

export function AppShell({ page, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 transform flex-col bg-sidebar transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-white">Trust Doc</span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              IT Documentation
            </span>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              page === item.page || (item.page === 'documents' && page === 'document-detail')
            return (
              <a
                key={item.name}
                href={`#${item.hash}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-sidebar-active')} />
                {item.name}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-[11px] leading-relaxed text-sidebar-muted">
            Agentic documentation expert for servers &amp; infrastructure.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
        </main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  )
}
