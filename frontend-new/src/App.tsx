import { QueryProvider } from './providers/QueryProvider'
import { ChatProvider } from './contexts/ChatContext'
import { MainLayout } from './layouts/MainLayout'
import { ChatSidebar } from './features/chat/components/ChatSidebar'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { useThemeStore } from './stores/themeStore'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

type Page = 'dashboard' | 'documents'

function App() {
  const theme = useThemeStore((state) => state.theme)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

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

  // Simple routing based on hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'docs' || hash === 'documents') {
        setCurrentPage('documents')
      } else {
        setCurrentPage('dashboard')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <QueryProvider>
      <ChatProvider>
        <MainLayout>
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'documents' && <Documents />}
        </MainLayout>
        <ChatSidebar />
        <Toaster theme={theme === 'dark' ? 'dark' : 'light'} richColors position='top-right' />
      </ChatProvider>
    </QueryProvider>
  )
}

export default App