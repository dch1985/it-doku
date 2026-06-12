import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  Library,
  Server,
  Sparkles,
  Settings,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'

export type RouteKey = 'dashboard' | 'library' | 'infrastructure' | 'agent' | 'settings'

const nav: { key: RouteKey; name: string; href: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', name: 'Dashboard', href: '#', icon: LayoutDashboard },
  { key: 'library', name: 'Library', href: '#library', icon: Library },
  { key: 'infrastructure', name: 'Infrastructure', href: '#infrastructure', icon: Server },
  { key: 'agent', name: 'Agent', href: '#agent', icon: Sparkles },
  { key: 'settings', name: 'Settings', href: '#settings', icon: Settings },
]

export function Layout({ active, children }: { active: RouteKey; children: ReactNode }) {
  const isOpen = useSidebarStore((s) => s.isOpen)
  const toggle = useSidebarStore((s) => s.toggle)
  const close = useSidebarStore((s) => s.close)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(199_89%_48%)] shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="block text-base font-bold text-white">TrustDoc</span>
            <span className="block text-[11px] text-sidebar-foreground/60">IT Documentation</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = item.key === active
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={() => close()}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                {item.name}
              </a>
            )
          })}
        </nav>

        <div className="px-4 pb-5">
          <div className="rounded-xl bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/70">
            <p className="mb-1 font-semibold text-sidebar-foreground">Agent ready</p>
            <p>Six expert skills available to draft your documentation.</p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggle} />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-card/60 px-4 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="lg:hidden">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="text-sm font-medium capitalize text-muted-foreground">
              {active === 'dashboard' ? 'Overview' : active}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

function UserMenu() {
  const { user, logout } = useAuthWrapper()
  const name = user?.name || 'IT Administrator'
  const email = user?.email || user?.username || 'admin@trustdoc.io'
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
