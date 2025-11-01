import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTenantStore } from '@/stores/tenantStore'
import { useTemplateStore } from '@/stores/templateStore'

// Helper function to get API URL (handles both with and without /api)
const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

interface Template {
  id: string
  name: string
  description?: string | null
  category: string
  content: string
  structure?: string | null
  tenantId?: string | null
  isGlobal: boolean
  tags?: string | null
  isNistCompliant: boolean
  nistFramework?: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

export function useTemplates() {
  const [loading, setLoading] = useState(false)
  const { currentTenant } = useTenantStore()
  const { templates, setTemplates, setLoading: setStoreLoading, setError } = useTemplateStore()

  const fetchTemplates = async () => {
    setLoading(true)
    setStoreLoading(true)
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates`, {
        headers,
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to load templates'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          errorMessage = `Failed to load templates (${response.status} ${response.statusText})`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setTemplates(data)
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Cannot connect to backend. Please check if the backend is running.')
      } else {
        toast.error(error.message || 'Failed to load templates')
      }
      setError(error.message || 'Failed to load templates')
    } finally {
      setLoading(false)
      setStoreLoading(false)
    }
  }

  const getTemplate = async (id: string) => {
    try {
      const headers: HeadersInit = {}
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates/${id}`, {
        headers,
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to fetch template (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('Error fetching template:', error)
      toast.error(error.message || 'Failed to load template')
      throw error
    }
  }

  const createTemplate = async (template: Partial<Template>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers,
        body: JSON.stringify(template)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to create template (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const newTemplate = await response.json()
      setTemplates([...templates, newTemplate])
      toast.success('Template created successfully!')
      return newTemplate
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast.error(error.message || 'Failed to create template')
      throw error
    }
  }

  const updateTemplate = async (id: string, template: Partial<Template>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(template)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to update template (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const updatedTemplate = await response.json()
      setTemplates(templates.map(t => t.id === id ? updatedTemplate : t))
      toast.success('Template updated successfully!')
      return updatedTemplate
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast.error(error.message || 'Failed to update template')
      throw error
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const headers: HeadersInit = {}
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',
        headers,
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to delete template (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      setTemplates(templates.filter(t => t.id !== id))
      toast.success('Template deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
      throw error
    }
  }

  const useTemplate = async (templateId: string, title?: string, customFields?: Record<string, any>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates/${templateId}/use`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, customFields })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create document from template'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to create document (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const document = await response.json()
      toast.success('Document created from template successfully!')
      return document
    } catch (error: any) {
      console.error('Error using template:', error)
      toast.error(error.message || 'Failed to create document from template')
      throw error
    }
  }

  const seedTemplates = async (force: boolean = false) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/templates/seed`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ force })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to seed templates'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to seed templates (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      if (result.existingTemplates && result.existingTemplates.length > 0 && !force) {
        toast.info(`${result.count} Templates existieren bereits. Verwenden Sie "Neu Seed (Force)" um zu ersetzen.`, {
          duration: 5000
        })
      } else {
        toast.success(`Alle ${result.count || 11} Templates erfolgreich erstellt!`, {
          duration: 3000
        })
      }
      await fetchTemplates() // Refresh templates list
      return result
    } catch (error: any) {
      console.error('Error seeding templates:', error)
      toast.error(error.message || 'Failed to seed templates')
      throw error
    }
  }

  useEffect(() => {
    // In dev mode, fetch templates even without a tenant (for global templates)
    // In production, only fetch if a tenant is selected
    const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
    
    if (currentTenant?.id || isDevMode) {
      fetchTemplates()
    } else {
      // Clear templates if no tenant is selected (production mode only)
      setTemplates([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id])

  return {
    templates,
    loading,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    seedTemplates,
    refetch: fetchTemplates
  }
}

