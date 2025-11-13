import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTenantStore } from '@/stores/tenantStore'
import { toast } from 'sonner'

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`
}

const API_URL = getApiUrl()

export interface SystemMetrics {
  totalDocuments: number
  totalTemplates: number
  totalUsers: number
}

export interface AutomationConnectorStatus {
  id: string
  name: string
  type: string
  isActive: boolean
  status: 'OK' | 'DEGRADED' | 'OFFLINE'
  lastJob?: {
    id: string
    status: string
    createdAt: string
  } | null
}

export interface AutomationMetrics {
  jobs: {
    started: number
    completed: number
    failed: number
    completionRate: number
  }
  suggestions: {
    applied: number
    dismissed: number
    estimatedTimeSavedHours: number
  }
  findingsOpen: number
  connectors: AutomationConnectorStatus[]
}

export interface CentralizeMetrics {
  assistant: {
    totalQueries: number
    byAudience: Array<{ audience: string; count: number }>
  }
  knowledge: {
    documentsWithCoverage: number
    documentsWithoutCoverage: number
    nodesWithoutDocument: number
    topTypes: Array<{ type: string; count: number }>
  }
}

export interface ComplyMetrics {
  findings: {
    openBySeverity: Array<{ severity: string; count: number }>
    avgResolutionDays: number
  }
  reviews: {
    openRequests: number
    avgCycleDays: number
  }
  policies: {
    reqIdCoveragePercent: number
    documentsWithReqId: number
  }
}

export interface AnalyticsData {
  system: SystemMetrics
  automation: AutomationMetrics
  centralize: CentralizeMetrics
  comply: ComplyMetrics
}

export function useAnalytics() {
  const { currentTenant } = useTenantStore()

  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (currentTenant) {
      headers['X-Tenant-ID'] = currentTenant.id
    }

    const response = await fetch(`${API_URL}/analytics`, { headers })

    if (!response.ok) {
      let errorMessage = 'Failed to fetch analytics'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `Failed to fetch analytics (${response.status} ${response.statusText})`
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['analytics', currentTenant?.id],
    queryFn: fetchAnalytics,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  })

  useEffect(() => {
    if (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    }
  }, [error])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

