import { useState } from 'react'
import { Layout, useTheme } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Documentation } from '@/pages/Documentation'
import { Agents } from '@/pages/Agents'
import { Settings } from '@/pages/Settings'
import type { Page } from '@/store/useStore'

export default function App() {
  useTheme()
  const [page, setPage] = useState<Page>('dashboard')
  const [agentId, setAgentId] = useState<string | undefined>()

  const navigate = (p: Page, agent?: string) => {
    setAgentId(agent)
    setPage(p)
  }

  return (
    <Layout page={page} onNavigate={(p) => navigate(p)}>
      {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {page === 'documentation' && <Documentation onNavigate={navigate} />}
      {page === 'agents' && <Agents initialAgentId={agentId} onNavigate={navigate} />}
      {page === 'settings' && <Settings />}
    </Layout>
  )
}
