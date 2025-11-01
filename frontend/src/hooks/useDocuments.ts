import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTenantStore } from '@/stores/tenantStore'

// Helper function to get API URL (handles both with and without /api)
const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

interface Document {
  id: string  // UUID String
  title: string
  content: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  userId?: string
  version?: number
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const { currentTenant } = useTenantStore()

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/documents`, {
        headers,
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to load documents'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          
          // Show specific error details if available
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Failed to load documents (${response.status} ${response.statusText})`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setDocuments(data)
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      
      // More specific error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Cannot connect to backend. Please check if the backend is running on http://localhost:3001')
      } else if (error.message.includes('firewall') || error.message.includes('FIREWALL_ERROR') || error.code === 'FIREWALL_ERROR') {
        toast.error('Database firewall error: Your IP address is not allowed. Please add your IP to Azure SQL Server firewall rules.', {
          duration: 10000
        })
      } else if (error.message.includes('database') || error.message.includes('Prisma') || error.message.includes('Database connection')) {
        toast.error('Database connection error. Please check database configuration.', {
          duration: 8000
        })
      } else {
        toast.error(error.message || 'Failed to load documents')
      }
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async (doc: Partial<Document>) => {
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(doc)
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to create document'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to create document (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const newDoc = await response.json()
      // Add to documents list immediately for instant UI update
      setDocuments([...documents, newDoc])
      toast.success('Dokument erfolgreich erstellt!')
      return newDoc
    } catch (error) {
      console.error('Error creating document:', error)
      toast.error('Failed to create document')
      throw error
    }
  }

  const updateDocument = async (id: string, doc: Partial<Document>) => {
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(doc)
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to update document'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to update document (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      const updatedDoc = await response.json()
      setDocuments(documents.map(d => d.id === id ? updatedDoc : d))
      toast.success('Document updated successfully!')
      return updatedDoc
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {}
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers,
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to delete document'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to delete document (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }
      
      setDocuments(documents.filter(d => d.id !== id))
      toast.success('Document deleted successfully!')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
      throw error
    }
  }

  const getDocument = async (id: string) => {
    try {
      // Build headers with tenant information
      const headers: HeadersInit = {}
      
      // Add tenant header if available
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        headers,
      })
      if (!response.ok) throw new Error('Failed to fetch document')
      return await response.json()
    } catch (error) {
      console.error('Error fetching document:', error)
      toast.error('Failed to load document')
      throw error
    }
  }

  useEffect(() => {
    // In dev mode, fetch documents even without tenant
    const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
    
    if (currentTenant?.id || isDevMode) {
      fetchDocuments()
    } else {
      // Clear documents if no tenant is selected (and not in dev mode)
      setDocuments([])
      setLoading(false)
    }
    // Note: fetchDocuments is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id]) // Only depend on tenant ID to avoid unnecessary re-renders

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    refetch: fetchDocuments
  }
}