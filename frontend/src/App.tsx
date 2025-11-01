import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { DevAuthProvider } from './contexts/DevAuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { MainLayout } from './layouts/MainLayout'
import { ChatSidebar } from './features/chat/components/ChatSidebar'
import { useThemeStore } from './stores/themeStore'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Dashboard, Documents, Settings, Analytics, DocumentDetail } from './router/lazyRoutes'

type Page = 'dashboard' | 'documents' | 'settings' | 'analytics' | 'document-detail'

function App() {
  const theme = useThemeStore((state) => state.theme)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

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

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'docs' || hash === 'documents') {
        setCurrentPage('documents')
      } else if (hash === 'settings') {
        setCurrentPage('settings')
      } else if (hash === 'analytics') {
        setCurrentPage('analytics')
      } else if (hash.startsWith('document/')) {
        const id = hash.split('/')[1]  // UUID String, kein parseInt()
        setSelectedDocumentId(id)
        setCurrentPage('document-detail')
      } else {
        setCurrentPage('dashboard')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Check if dev auth is enabled
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
  const AuthWrapper = isDevMode ? DevAuthProvider : AuthProvider;

  return (
        <ErrorBoundary>
          <AuthWrapper>
            <QueryProvider>
              <ChatProvider>
                <MainLayout>
                  {currentPage === 'dashboard' && <Dashboard />}
                  {currentPage === 'documents' && <Documents />}
                  {currentPage === 'settings' && <Settings />}
                  {currentPage === 'analytics' && <Analytics />}
                  {currentPage === 'document-detail' && selectedDocumentId && (
                    <DocumentDetail 
                      documentId={selectedDocumentId} 
                      onBack={() => {
                        window.location.hash = 'documents'
                      }} 
                    />
                  )}
                </MainLayout>
                <ChatSidebar />
                <Toaster theme={theme === 'dark' ? 'dark' : 'light'} richColors position='top-right' />
              </ChatProvider>
            </QueryProvider>
          </AuthWrapper>
        </ErrorBoundary>
      )
}

export default App