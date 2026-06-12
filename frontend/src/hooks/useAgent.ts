import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTenantStore } from '@/stores/tenantStore'

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`
}

const API_URL = getApiUrl()

export interface AgentSkill {
  id: string
  name: string
  description: string
  checks: string[]
}

export interface AgentRun {
  id: string
  skill: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  summary: string | null
  startedAt: string
  finishedAt: string | null
  _count?: { findings: number }
}

export interface AgentFinding {
  id: string
  skill: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  detail: string | null
  documentId: string | null
  assetId: string | null
  proposedAction: string | null
  status: 'OPEN' | 'APPLIED' | 'DISMISSED'
  createdAt: string
}

export interface RunSummary {
  scanned: number
  findings: number
  duplicatesSkipped: number
  bySeverity: Record<string, number>
}

export function parseRunSummary(run: AgentRun): RunSummary | null {
  if (!run.summary) return null
  try {
    return JSON.parse(run.summary)
  } catch {
    return null
  }
}

export function parseProposedAction(finding: AgentFinding): { action: string; label?: string } | null {
  if (!finding.proposedAction) return null
  try {
    return JSON.parse(finding.proposedAction)
  } catch {
    return null
  }
}

export function useAgent() {
  const [skills, setSkills] = useState<AgentSkill[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [findings, setFindings] = useState<AgentFinding[]>([])
  const [loading, setLoading] = useState(true)
  const [runningSkill, setRunningSkill] = useState<string | null>(null)
  const { currentTenant } = useTenantStore()

  const headers = useCallback((): HeadersInit => {
    const h: HeadersInit = { 'Content-Type': 'application/json' }
    if (currentTenant) h['X-Tenant-ID'] = currentTenant.id
    return h
  }, [currentTenant])

  const refresh = useCallback(async () => {
    try {
      const [skillsRes, runsRes, findingsRes] = await Promise.all([
        fetch(`${API_URL}/agent/skills`, { headers: headers() }),
        fetch(`${API_URL}/agent/runs`, { headers: headers() }),
        fetch(`${API_URL}/agent/findings`, { headers: headers() }),
      ])
      if (skillsRes.ok) setSkills(await skillsRes.json())
      if (runsRes.ok) setRuns(await runsRes.json())
      if (findingsRes.ok) setFindings(await findingsRes.json())
    } catch (error) {
      console.error('Error loading agent data:', error)
      toast.error('Cannot reach the TrustDoc agent. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    refresh()
  }, [refresh])

  const runSkill = async (skillId: string) => {
    setRunningSkill(skillId)
    try {
      const response = await fetch(`${API_URL}/agent/run`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ skill: skillId }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Agent run failed')
      }
      const run: AgentRun & { findings?: AgentFinding[] } = await response.json()
      const summary = parseRunSummary(run)
      if (summary) {
        toast.success(
          summary.findings > 0
            ? `Scan complete: ${summary.scanned} item(s) checked, ${summary.findings} new finding(s).`
            : `Scan complete: ${summary.scanned} item(s) checked, no new findings.`
        )
      } else {
        toast.success('Agent run completed')
      }
      await refresh()
      return run
    } catch (error: any) {
      toast.error(error.message || 'Agent run failed')
      throw error
    } finally {
      setRunningSkill(null)
    }
  }

  const applyFinding = async (findingId: string) => {
    try {
      const response = await fetch(`${API_URL}/agent/findings/${findingId}/apply`, {
        method: 'POST',
        headers: headers(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Failed to apply remediation')
      toast.success('Remediation applied')
      await refresh()
      return data
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply remediation')
      throw error
    }
  }

  const dismissFinding = async (findingId: string) => {
    try {
      const response = await fetch(`${API_URL}/agent/findings/${findingId}/dismiss`, {
        method: 'POST',
        headers: headers(),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to dismiss finding')
      }
      toast.success('Finding dismissed')
      await refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to dismiss finding')
      throw error
    }
  }

  return { skills, runs, findings, loading, runningSkill, runSkill, applyFinding, dismissFinding, refresh }
}
