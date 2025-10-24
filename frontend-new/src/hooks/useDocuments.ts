import { useState, useEffect } from 'react'
import { toast } from 'sonner'

const API_URL = 'http://localhost:3001/api'

interface Document {
  id: number
  title: string
  content: string
  category: string
  status: string
  size: string
  createdAt: string
  updatedAt: string
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/documents`)
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async (doc: Partial<Document>) => {
    try {
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      })
      if (!response.ok) throw new Error('Failed to create document')
      const newDoc = await response.json()
      setDocuments([...documents, newDoc])
      toast.success('Document created successfully!')
      return newDoc
    } catch (error) {
      console.error('Error creating document:', error)
      toast.error('Failed to create document')
      throw error
    }
  }

  const updateDocument = async (id: number, doc: Partial<Document>) => {
    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      })
      if (!response.ok) throw new Error('Failed to update document')
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

  const deleteDocument = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete document')
      setDocuments(documents.filter(d => d.id !== id))
      toast.success('Document deleted successfully!')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
      throw error
    }
  }

  const getDocument = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/documents/${id}`)
      if (!response.ok) throw new Error('Failed to fetch document')
      return await response.json()
    } catch (error) {
      console.error('Error fetching document:', error)
      toast.error('Failed to load document')
      throw error
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

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