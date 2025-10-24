import { QueryProvider } from './providers/QueryProvider'
import { ChatProvider } from './contexts/ChatContext'
import { MainLayout } from './layouts/MainLayout'
import { ChatSidebar } from './features/chat/components/ChatSidebar'
import { useThemeStore } from './stores/themeStore'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function App() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <QueryProvider>
      <ChatProvider>
        <MainLayout>
          <div className='space-y-6'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight'>Welcome back!</h2>
              <p className='text-muted-foreground'>
                Here's what's happening with your documentation today.
              </p>
            </div>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Documents</CardTitle>
                  <span className='text-2xl'>📄</span>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>245</div>
                  <p className='text-xs text-muted-foreground'>+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>AI Queries</CardTitle>
                  <span className='text-2xl'>💬</span>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>1,284</div>
                  <p className='text-xs text-muted-foreground'>+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
                  <span className='text-2xl'>👥</span>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>42</div>
                  <p className='text-xs text-muted-foreground'>+4 new this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Storage Used</CardTitle>
                  <span className='text-2xl'>💾</span>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>2.4 GB</div>
                  <p className='text-xs text-muted-foreground'>18% of 15 GB</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent className='flex gap-2'>
                <Button>New Document</Button>
                <Button variant='outline'>Ask AI</Button>
                <Button variant='outline'>View Templates</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates to your documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    { title: 'Server Documentation Updated', time: '2 hours ago' },
                    { title: 'New AI Chat Session', time: '4 hours ago' },
                    { title: 'Template Created', time: '1 day ago' },
                  ].map((activity, i) => (
                    <div key={i} className='flex items-center gap-4'>
                      <div className='h-2 w-2 rounded-full bg-primary' />
                      <div className='flex-1'>
                        <p className='text-sm font-medium'>{activity.title}</p>
                        <p className='text-xs text-muted-foreground'>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
        <ChatSidebar />
      </ChatProvider>
    </QueryProvider>
  )
}

export default App