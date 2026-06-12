import { useEffect, useState } from 'react'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAppStore } from '@/stores/useAppStore'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { TenantSelector } from '@/components/TenantSelector'
import { NotificationsDropdown } from '@/components/NotificationsDropdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Server,
  Bot,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', hash: '', icon: LayoutDashboard }],
  },
  {
    label: 'Workspace',
    items: [
      { name: 'Documentation', hash: 'docs', icon: FileText },
      { name: 'Infrastructure', hash: 'infrastructure', icon: Server },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ name: 'Agent', hash: 'agent', icon: Bot }],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', hash: 'settings', icon: Settings }],
  },
]

function useCurrentHash() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function isActive(currentHash: string, itemHash: string) {
  if (itemHash === '') return currentHash === '' || currentHash === '/'
  if (itemHash === 'docs') return currentHash === 'docs' || currentHash === 'documents' || currentHash.startsWith('document/')
  if (itemHash === 'infrastructure') return currentHash === 'infrastructure' || currentHash === 'assets'
  return currentHash === itemHash
}

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const currentHash = useCurrentHash()

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center gap-2.5 border-b px-5'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-sm'>
              <ShieldCheck className='h-5 w-5 text-primary-foreground' />
            </div>
            <div className='leading-tight'>
              <span className='block text-base font-bold tracking-tight'>TrustDoc</span>
              <span className='block text-[11px] text-muted-foreground'>IT documentation, trusted.</span>
            </div>
          </div>

          <nav className='flex-1 space-y-5 overflow-y-auto px-3 py-4'>
            {navigation.map((group) => (
              <div key={group.label}>
                <p className='px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                  {group.label}
                </p>
                <div className='space-y-0.5'>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(currentHash, item.hash)
                    return (
                      <a
                        key={item.name}
                        href={`#${item.hash}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className='h-4 w-4' />
                        {item.name}
                        {active && <span className='ml-auto h-1.5 w-1.5 rounded-full bg-primary' />}
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className='space-y-2 border-t p-3'>
            <TenantSelector />
            <UserProfile />
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card/60 px-6 backdrop-blur'>
          <Button variant='ghost' size='icon' onClick={toggle} className='lg:hidden'>
            {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>

          <div className='flex-1'>
            <SearchBar />
          </div>

          <div className='flex items-center gap-1'>
            <NotificationsDropdown />
            <ThemeToggle />
          </div>
        </header>

        <main className='flex-1 overflow-y-auto p-6 lg:p-8'>{children}</main>
      </div>

      {isOpen && <div className='fixed inset-0 z-40 bg-black/50 lg:hidden' onClick={toggle} />}
    </div>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Moon className='h-5 w-5' /> : <Sun className='h-5 w-5' />}
    </Button>
  )
}

function UserProfile() {
  const { isAuthenticated, user, login, logout } = useAuthWrapper()
  const appUser = useAppStore((state) => state.user)

  if (!isAuthenticated) {
    return (
      <Button onClick={login} className='w-full' variant='outline'>
        <User className='mr-2 h-4 w-4' />
        Log In
      </Button>
    )
  }

  const displayName = appUser?.name || user?.name || 'User'
  const email = appUser?.email || (user && 'username' in user ? user.username : user?.email)
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='w-full justify-start px-2'>
          <Avatar className='mr-2 h-8 w-8'>
            <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>{initials}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1 text-left'>
            <p className='truncate text-sm font-medium'>{displayName}</p>
            <p className='truncate text-xs text-muted-foreground'>{email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
