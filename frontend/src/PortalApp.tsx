import { MainLayout } from './layouts/MainLayout'
import { ChatSidebar } from './features/chat/components/ChatSidebar'
import { useThemeStore } from './stores/themeStore'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Dashboard, Documents, Settings, Analytics, DocumentDetail, Passwords, Assets, Contracts, NetworkDevices, CustomerPortals, ProcessRecordings } from './router/lazyRoutes'

type Page = 'dashboard' | 'documents' | 'settings' | 'analytics' | 'document-detail' | 'passwords' | 'assets' | 'contracts' | 'network-devices' | 'customer-portals' | 'process-recordings'

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
      } else if (hash === 'analytics') {
        setCurrentPage('analytics')
      } else if (hash === 'passwords') {
        setCurrentPage('passwords')
      } else if (hash === 'assets') {
        setCurrentPage('assets')
      } else if (hash === 'contracts') {
        setCurrentPage('contracts')
      } else if (hash === 'network-devices') {
        setCurrentPage('network-devices')
      } else if (hash === 'customer-portals') {
        setCurrentPage('customer-portals')
      } else if (hash === 'process-recordings') {
        setCurrentPage('process-recordings')
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

  return (
    <>
      <MainLayout>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'documents' && <Documents />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'passwords' && <Passwords />}
        {currentPage === 'assets' && <Assets />}
        {currentPage === 'contracts' && <Contracts />}
        {currentPage === 'network-devices' && <NetworkDevices />}
        {currentPage === 'customer-portals' && <CustomerPortals />}
        {currentPage === 'process-recordings' && <ProcessRecordings />}
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
    </>
  )
}

