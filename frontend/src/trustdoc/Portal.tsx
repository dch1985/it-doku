import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Layout, type RouteKey } from './Layout'
import { useThemeStore } from '@/stores/themeStore'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { DocumentView } from './pages/DocumentView'
import { Infrastructure } from './pages/Infrastructure'
import { Agent } from './pages/Agent'
import { Settings } from './pages/Settings'

interface Route {
  key: RouteKey
  documentId?: string
  skillId?: string
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash === '' || hash === 'dashboard') return { key: 'dashboard' }
  if (hash === 'library') return { key: 'library' }
  if (hash === 'infrastructure') return { key: 'infrastructure' }
  if (hash === 'settings') return { key: 'settings' }
  if (hash === 'agent') return { key: 'agent' }
  if (hash.startsWith('agent/')) return { key: 'agent', skillId: hash.split('/')[1] }
  if (hash.startsWith('document/')) return { key: 'library', documentId: hash.split('/')[1] }
  return { key: 'dashboard' }
}

export function Portal() {
  const theme = useThemeStore((s) => s.theme)
  const [route, setRoute] = useState<Route>(parseHash())

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(sys)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const renderContent = () => {
    if (route.documentId) {
      return (
        <DocumentView
          documentId={route.documentId}
          onBack={() => {
            window.location.hash = 'library'
          }}
        />
      )
    }
    switch (route.key) {
      case 'library':
        return <Library />
      case 'infrastructure':
        return <Infrastructure />
      case 'agent':
        return <Agent initialSkillId={route.skillId} />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <>
      <Layout active={route.key}>{renderContent()}</Layout>
      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} richColors position="top-right" />
    </>
  )
}
