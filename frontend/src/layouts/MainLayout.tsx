import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAppStore } from '@/stores/useAppStore'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { TenantSelector } from '@/components/TenantSelector'
import { NotificationsDropdown } from '@/components/NotificationsDropdown'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X, Home, FileText, Settings, LogOut, User, ShieldCheck, Database, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'Expert Skills', href: '/skills', icon: Sparkles },
  { name: 'Knowledge', href: '/knowledge', icon: Database },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const [activeHash, setActiveHash] = useState(window.location.hash.slice(1))

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash.slice(1))
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  const isActiveLink = (href: string) => {
    const target = href === '/' ? '' : href.slice(1)
    if (target === 'docs') {
      return activeHash === 'docs' || activeHash === 'documents' || activeHash.startsWith('document/')
    }
    if (target === 'knowledge') {
      return activeHash === 'knowledge' || activeHash === 'centralize'
    }
    if (target === 'compliance') {
      return activeHash === 'compliance' || activeHash === 'comply'
    }
    return activeHash === target
  }

  return (
    <div className='flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/30'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r bg-card/95 backdrop-blur transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          <div className='flex h-20 items-center gap-3 border-b px-6'>
            <div className='rounded-2xl bg-primary p-2 text-primary-foreground shadow-sm'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <div>
              <span className='text-xl font-semibold tracking-tight'>Trust Doc</span>
              <p className='text-xs text-muted-foreground'>IT documentation, verified</p>
            </div>
          </div>

          <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActiveLink(item.href)
              
              return (
                <a
                  key={item.name}
                  href={`#${item.href === '/' ? '' : item.href.slice(1)}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {item.name}
                </a>
              )
            })}
          </nav>

          <div className='mx-4 mb-4 rounded-2xl border bg-muted/40 p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <p className='text-sm font-medium'>Skill mode</p>
              <Badge variant='secondary' className='text-[10px]'>No chatbot</Badge>
            </div>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              Guided experts help document servers, infrastructure, networks, backups, and controls with checklists and evidence.
            </p>
          </div>

          <div className='border-t p-4 space-y-2'>
            <TenantSelector />
            <UserProfile />
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card/80 px-6 backdrop-blur'>
  <Button variant='ghost' size='icon' onClick={toggle} className='lg:hidden'>
    {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
  </Button>

  <div className='flex-1'>
    <SearchBar />
  </div>

  <div className='flex items-center gap-2'>
    <NotificationsDropdown />
    <ThemeToggle />
  </div>
</header>

        <main className='flex-1 overflow-y-auto p-6'>{children}</main>
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