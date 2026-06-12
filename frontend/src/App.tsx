import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { parseHash, type Route } from '@/lib/navigation'
import { useThemeStore } from '@/stores/themeStore'
import { Dashboard } from '@/pages/Dashboard'
import { Documents } from '@/pages/Documents'
import { DocumentDetail } from '@/pages/DocumentDetail'
import { Infrastructure } from '@/pages/Infrastructure'
import { Agent } from '@/pages/Agent'
import { Settings } from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false },
  },
})

function App() {
  const theme = useThemeStore((s) => s.theme)
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell page={route.page}>
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'documents' && <Documents />}
        {route.page === 'document-detail' && route.documentId && (
          <DocumentDetail documentId={route.documentId} />
        )}
        {route.page === 'infrastructure' && <Infrastructure />}
        {route.page === 'agent' && <Agent />}
        {route.page === 'settings' && <Settings />}
      </AppShell>
      <Toaster theme={theme} richColors position="top-right" />
    </QueryClientProvider>
  )
}

export default App
