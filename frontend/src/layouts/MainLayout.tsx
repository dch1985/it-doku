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
import { Menu, X, Home, FileText, MessageSquare, BarChart3, Settings, LogOut, User, Lock, Server, FileSignature, Radio, Globe, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'Passwords', href: '/passwords', icon: Lock },
  { name: 'Assets', href: '/assets', icon: Server },
  { name: 'Contracts', href: '/contracts', icon: FileSignature },
  { name: 'Network Devices', href: '/network-devices', icon: Radio },
  { name: 'Customer Portals', href: '/customer-portals', icon: Globe },
  { name: 'Process Recordings', href: '/process-recordings', icon: Video },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)
  const isChatOpen = useSidebarStore((state) => state.isChatOpen)
  const toggleChat = useSidebarStore((state) => state.toggleChat)

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center gap-2 border-b px-6'>
            <FileText className='h-6 w-6 text-primary' />
            <span className='text-lg font-semibold'>IT-Doku</span>
          </div>

          <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/chat' ? isChatOpen : false
              
              // Special handling for AI Chat button
              if (item.href === '/chat') {
                return (
                  <button
                    key={item.name}
                    onClick={toggleChat}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    title='AI Chat öffnen'
                  >
                    <Icon className='h-4 w-4' />
                    {item.name}
                    {isChatOpen && (
                      <span className='ml-auto h-2 w-2 rounded-full bg-primary' />
                    )}
                  </button>
                )
              }
              
              // Regular navigation links for other items
              return (
                <a
                  key={item.name}
                  href={`#${item.href === '/' ? '' : item.href.slice(1)}`}
                  className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
                >
                  <Icon className='h-4 w-4' />
                  {item.name}
                </a>
              )
            })}
          </nav>

          <div className='border-t p-4 space-y-2'>
            <TenantSelector />
            <UserProfile />
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card px-6'>
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