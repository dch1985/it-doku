import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '@/stores/useDocumentStore'

describe('useDocumentStore', () => {
  beforeEach(() => {
    // Reset store
    useDocumentStore.setState({
      documents: [],
      selectedDocument: null,
      filters: {
        search: '',
        category: 'ALL',
        tags: [],
      },
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 20,
      totalPages: 1,
    })
  })

  describe('Document Management', () => {
    it('should add a new document', () => {
      const { addDocument } = useDocumentStore.getState()
      
      const newDoc = {
        id: '1',
        title: 'Test Doc',
        content: 'Test content',
        category: 'DOCUMENTATION' as const,
        tags: ['test'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
      
      addDocument(newDoc)
      
      const { documents } = useDocumentStore.getState()
      expect(documents).toHaveLength(1)
      expect(documents[0]).toEqual(newDoc)
    })

    it('should update a document', () => {
      const { addDocument, updateDocument } = useDocumentStore.getState()
      
      const doc = {
        id: '1',
        title: 'Original',
        content: 'content',
        category: 'DOCUMENTATION' as const,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
      
      addDocument(doc)
      
      updateDocument('1', { title: 'Updated Title' })
      
      const { documents } = useDocumentStore.getState()
      expect(documents[0].title).toBe('Updated Title')
    })

    it('should delete a document', () => {
      const { addDocument, deleteDocument } = useDocumentStore.getState()
      
      const doc = {
        id: '1',
        title: 'Test',
        content: 'content',
        category: 'DOCUMENTATION' as const,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
      
      addDocument(doc)
      expect(useDocumentStore.getState().documents).toHaveLength(1)
      
      deleteDocument('1')
      expect(useDocumentStore.getState().documents).toHaveLength(0)
    })

    it('should select a document', () => {
      const { addDocument, selectDocument } = useDocumentStore.getState()
      
      const doc = {
        id: '1',
        title: 'Test',
        content: 'content',
        category: 'DOCUMENTATION' as const,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
      
      addDocument(doc)
      selectDocument(doc)
      
      expect(useDocumentStore.getState().selectedDocument).toEqual(doc)
    })
  })

  describe('Filters', () => {
    it('should set search filter', () => {
      const { setFilters } = useDocumentStore.getState()
      
      setFilters({ search: 'test query' })
      
      expect(useDocumentStore.getState().filters.search).toBe('test query')
    })

    it('should set category filter', () => {
      const { setFilters } = useDocumentStore.getState()
      
      setFilters({ category: 'CODE_ANALYSIS' })
      
      expect(useDocumentStore.getState().filters.category).toBe('CODE_ANALYSIS')
    })

    it('should reset filters', () => {
      const { setFilters, resetFilters } = useDocumentStore.getState()
      
      setFilters({ search: 'test', category: 'CODE_ANALYSIS', tags: ['tag1'] })
      resetFilters()
      
      const { filters } = useDocumentStore.getState()
      expect(filters.search).toBe('')
      expect(filters.category).toBe('ALL')
      expect(filters.tags).toEqual([])
    })

    it('should reset to page 1 when filters change', () => {
      const { setFilters, setPage } = useDocumentStore.getState()
      
      setPage(5)
      expect(useDocumentStore.getState().currentPage).toBe(5)
      
      setFilters({ search: 'test' })
      expect(useDocumentStore.getState().currentPage).toBe(1)
    })
  })

  describe('Pagination', () => {
    it('should change page', () => {
      const { setPage } = useDocumentStore.getState()
      
      setPage(3)
      
      expect(useDocumentStore.getState().currentPage).toBe(3)
    })

    it('should update page size and reset to page 1', () => {
      const { setPageSize, setPage } = useDocumentStore.getState()
      
      setPage(5)
      setPageSize(50)
      
      expect(useDocumentStore.getState().pageSize).toBe(50)
      expect(useDocumentStore.getState().currentPage).toBe(1)
    })

    it('should calculate total pages when adding documents', () => {
      const { setDocuments } = useDocumentStore.getState()
      
      const docs = Array.from({ length: 45 }, (_, i) => ({
        id: `${i}`,
        title: `Doc ${i}`,
        content: 'content',
        category: 'DOCUMENTATION' as const,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }))
      
      setDocuments(docs)
      
      // 45 docs / 20 per page = 3 pages
      expect(useDocumentStore.getState().totalPages).toBe(3)
    })
  })
})
