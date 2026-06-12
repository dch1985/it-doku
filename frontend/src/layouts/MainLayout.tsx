import { useEffect, useState, type ReactNode } from 'react'
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
import { Menu, X, Home, FileText, BarChart3, Settings, LogOut, User, Server, Radio, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Overview', href: '/', icon: Home, description: 'Readiness' },
  { name: 'Documentation', href: '/docs', icon: FileText, description: 'Runbooks and SOPs' },
  { name: 'Infrastructure', href: '/assets', icon: Server, description: 'Servers and services' },
  { name: 'Network', href: '/network-devices', icon: Radio, description: 'Devices and topology' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Coverage and findings' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Workspace control' },
]

const getHashForHref = (href: string) => (href === '/' ? '' : href.slice(1))

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const [currentHash, setCurrentHash] = useState(() => window.location.hash.slice(1))

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash.slice(1))

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className='flex h-screen overflow-hidden bg-muted/20'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r bg-card/95 shadow-xl shadow-black/5 backdrop-blur transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          <div className='border-b px-6 py-5'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <span className='text-lg font-semibold tracking-tight'>Trust Doc</span>
                <p className='text-xs text-muted-foreground'>IT documentation expert</p>
              </div>
            </div>
          </div>

          <nav className='flex-1 space-y-2 overflow-y-auto p-4'>
            {navigation.map((item) => {
              const Icon = item.icon
              const hash = getHashForHref(item.href)
              const isActive =
                currentHash === hash ||
                (item.href === '/docs' && (currentHash === 'documents' || currentHash.startsWith('document/')))

              return (
                <a
                  key={item.name}
                  href={`#${hash}`}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
                  )}
                >
                  <Icon className='h-4 w-4 shrink-0' />
                  <span className='flex flex-col'>
                    <span className='font-medium'>{item.name}</span>
                    <span className={cn('text-xs text-muted-foreground', isActive && 'text-primary-foreground/70')}>
                      {item.description}
                    </span>
                  </span>
                </a>
              )
            })}
          </nav>

          <div className='border-t p-4 space-y-2'>
            <div className='rounded-2xl border bg-muted/40 p-4'>
              <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                <ShieldCheck className='h-4 w-4 text-primary' />
                Agent skills
              </div>
              <p className='text-xs leading-relaxed text-muted-foreground'>
                Structured checks for servers, infrastructure, network, backups, and compliance.
              </p>
            </div>
            <TenantSelector />
            <UserProfile />
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-background/85 px-6 backdrop-blur'>
          <Button variant='ghost' size='icon' onClick={toggle} className='lg:hidden'>
            {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>

          <div className='hidden min-w-0 lg:block'>
            <p className='text-sm font-medium'>Trust Doc workspace</p>
            <p className='text-xs text-muted-foreground'>Expert documentation for IT operations</p>
          </div>

          <div className='flex-1'>
            <SearchBar />
          </div>

          <div className='flex items-center gap-2'>
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
    <Button variant='ghost' size='icon' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <span className='text-lg'>{theme === 'dark' ? '🌙' : '☀️'}</span>
    </Button>
  )
}

function UserProfile() {
      // Use the wrapper hook that automatically selects the correct auth provider
      const { isAuthenticated, user, login, logout } = useAuthWrapper();
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
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='w-full justify-start'>
          <Avatar className='h-8 w-8 mr-2'>
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
          <div className='flex-1 text-left'>
            <p className='text-sm font-medium'>{displayName}</p>
            <p className='text-xs text-muted-foreground'>{appUser?.email || (user && 'username' in user ? user.username : user.email)}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>{appUser?.email || (user && 'username' in user ? user.username : user.email)}</p>
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