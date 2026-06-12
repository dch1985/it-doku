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
import { Menu, X, Home, FileText, Bot, Server, Settings, LogOut, User, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documents', href: '/docs', icon: FileText },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Infrastructure', href: '/infrastructure', icon: Server },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center gap-3 border-b border-sidebar-border px-6'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg trust-gradient'>
              <Shield className='h-4 w-4 text-white' />
            </div>
            <div>
              <span className='text-lg font-bold tracking-tight text-sidebar-foreground'>Trust Doc</span>
              <p className='text-[10px] text-sidebar-foreground/60 leading-none'>IT Documentation</p>
            </div>
          </div>

          <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
            {navigation.map((item) => {
              const Icon = item.icon
              const hash = item.href === '/' ? '' : item.href.slice(1)
              const currentHash = window.location.hash.slice(1)
              const isActive = hash === '' ? !currentHash || currentHash === 'dashboard' : currentHash === hash || currentHash.startsWith(hash)

              return (
                <a
                  key={item.name}
                  href={`#${hash}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {item.name}
                </a>
              )
            })}
          </nav>

          <div className='border-t border-sidebar-border p-4 space-y-2'>
            <TenantSelector />
            <UserProfile />
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-6'>
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

        <main className='flex-1 overflow-y-auto p-6 md:p-8'>{children}</main>
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
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className='rounded-xl'
    >
      <span className='text-lg'>{theme === 'dark' ? '🌙' : '☀️'}</span>
    </Button>
  )
}

function UserProfile() {
  const { isAuthenticated, user, login, logout } = useAuthWrapper()
  const appUser = useAppStore((state) => state.user)

  if (!isAuthenticated) {
    return (
      <Button onClick={login} className='w-full rounded-xl' variant='outline'>
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
        <Button variant='ghost' className='w-full justify-start rounded-xl hover:bg-sidebar-accent'>
          <Avatar className='h-8 w-8 mr-2'>
            <AvatarFallback className='text-xs bg-sidebar-primary text-sidebar-primary-foreground'>{initials}</AvatarFallback>
          </Avatar>
          <div className='flex-1 text-left'>
            <p className='text-sm font-medium text-sidebar-foreground'>{displayName}</p>
            <p className='text-xs text-sidebar-foreground/60'>{appUser?.email || (user && 'username' in user ? user.username : user?.email)}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>{appUser?.email || (user && 'username' in user ? user.username : user?.email)}</p>
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
