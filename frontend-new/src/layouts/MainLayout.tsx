import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, FileText, MessageSquare, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainLayout({ children }: MainLayoutProps) {
  const isOpen = useSidebarStore((state) => state.isOpen)
  const toggle = useSidebarStore((state) => state.toggle)

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
              return (
                <a key={item.name} href={item.href} className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'>
                  <Icon className='h-5 w-5' />
                  {item.name}
                </a>
              )
            })}
          </nav>

          <div className='border-t p-4'>
            <div className='flex items-center gap-3'>
              <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium'>DC</div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Driss Chaouat</p>
                <p className='text-xs text-muted-foreground'>IT Consultant</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card px-6'>
          <Button variant='ghost' size='icon' onClick={toggle} className='lg:hidden'>
            {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>

          <div className='flex-1'>
            <h1 className='text-lg font-semibold'>Dashboard</h1>
          </div>

          <div className='flex items-center gap-2'>
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