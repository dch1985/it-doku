import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTenantStore } from '@/stores/tenantStore'
import { toast } from 'sonner'

// Helper function to get API URL
const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`
}

const API_URL = getApiUrl()

export interface AnalyticsStats {
  totalDocuments: number
  totalUsers: number
  totalTemplates: number
  growthRate: number
  documentsPerUser: number
  peakHour: string
  avgResponseTime: number
}

export interface AnalyticsCharts {
  documentGrowth: Array<{ month: string; documents: number; users: number }>
  categoryDistribution: Array<{ name: string; value: number; color: string }>
  activityByHour: Array<{ hour: string; activity: number }>
  userEngagement: Array<{ week: string; active: number; new: number }>
  documentsByStatus: Array<{ name: string; value: number }>
}

export interface AnalyticsData {
  stats: AnalyticsStats
  charts: AnalyticsCharts
}

export function useAnalytics() {
  const { currentTenant } = useTenantStore()

  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add tenant header if available
    if (currentTenant) {
      headers['X-Tenant-ID'] = currentTenant.id
    }
    
    const response = await fetch(`${API_URL}/analytics`, {
      headers,
    })
    
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

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<AnalyticsData>({
    queryKey: ['analytics', currentTenant?.id],
    queryFn: fetchAnalytics,
    staleTime: 30000, // Cache for 30 seconds
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
    refetch
  }
}

