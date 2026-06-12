import { MainLayout } from './layouts/MainLayout'
import { useThemeStore } from './stores/themeStore'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Dashboard, Documents, Settings, DocumentDetail, Agents, Infrastructure } from './router/lazyRoutes'

type Page = 'dashboard' | 'documents' | 'settings' | 'agents' | 'infrastructure' | 'document-detail'

export function PortalApp() {
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
      } else if (hash === 'agents') {
        setCurrentPage('agents')
      } else if (hash === 'infrastructure') {
        setCurrentPage('infrastructure')
      } else if (hash.startsWith('document/')) {
        const id = hash.split('/')[1]
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

  return (
    <>
      <MainLayout>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'documents' && <Documents />}
        {currentPage === 'agents' && <Agents />}
        {currentPage === 'infrastructure' && <Infrastructure />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'document-detail' && selectedDocumentId && (
          <DocumentDetail
            documentId={selectedDocumentId}
            onBack={() => {
              window.location.hash = 'documents'
            }}
          />
        )}
      </MainLayout>
      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} richColors position='top-right' />
    </>
  )
}
