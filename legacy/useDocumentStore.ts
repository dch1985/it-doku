import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface Document {
  id: string;
  title: string;
  content: string;
  category: 'DOCUMENTATION' | 'CODE_ANALYSIS' | 'TEMPLATE' | 'KNOWLEDGE_BASE';
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface DocumentFilters {
  search: string;
  category: Document['category'] | 'ALL';
  tags: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

interface DocumentState {
  // Documents
  documents: Document[];
  selectedDocument: Document | null;
  
  // Filters & Search
  filters: DocumentFilters;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (document: Document | null) => void;
  
  // Filter Actions
  setFilters: (filters: Partial<DocumentFilters>) => void;
  resetFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: DocumentFilters = {
  search: '',
  category: 'ALL',
  tags: [],
};

export const useDocumentStore = create<DocumentState>()(
  devtools(
    immer((set) => ({
      // Initial State
      documents: [],
      selectedDocument: null,
      filters: initialFilters,
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 20,
      totalPages: 1,

      // Actions
      setDocuments: (documents) =>
        set((state) => {
          state.documents = documents;
          state.totalPages = Math.ceil(documents.length / state.pageSize);
        }),

      addDocument: (document) =>
        set((state) => {
          state.documents.unshift(document);
          state.totalPages = Math.ceil(state.documents.length / state.pageSize);
        }),

      updateDocument: (id, updates) =>
        set((state) => {
          const index = state.documents.findIndex((doc) => doc.id === id);
          if (index !== -1) {
            state.documents[index] = {
              ...state.documents[index],
              ...updates,
              updatedAt: new Date(),
            };
          }
          if (state.selectedDocument?.id === id) {
            state.selectedDocument = {
              ...state.selectedDocument,
              ...updates,
              updatedAt: new Date(),
            };
          }
        }),

      deleteDocument: (id) =>
        set((state) => {
          state.documents = state.documents.filter((doc) => doc.id !== id);
          if (state.selectedDocument?.id === id) {
            state.selectedDocument = null;
          }
          state.totalPages = Math.ceil(state.documents.length / state.pageSize);
        }),

      selectDocument: (document) =>
        set((state) => {
          state.selectedDocument = document;
        }),

      // Filter Actions
      setFilters: (newFilters) =>
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
          state.currentPage = 1; // Reset to first page on filter change
        }),

      resetFilters: () =>
        set((state) => {
          state.filters = initialFilters;
          state.currentPage = 1;
        }),

      // Pagination
      setPage: (page) =>
        set((state) => {
          state.currentPage = page;
        }),

      setPageSize: (size) =>
        set((state) => {
          state.pageSize = size;
          state.totalPages = Math.ceil(state.documents.length / size);
          state.currentPage = 1;
        }),

      // Loading & Error
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    })),
    { name: 'DocumentStore' }
  )
);

// Selectors (für optimierte Performance)
export const selectFilteredDocuments = (state: DocumentState) => {
  let filtered = [...state.documents];

  // Search
  if (state.filters.search) {
    const search = state.filters.search.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.title.toLowerCase().includes(search) ||
        doc.content.toLowerCase().includes(search) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  // Category
  if (state.filters.category !== 'ALL') {
    filtered = filtered.filter((doc) => doc.category === state.filters.category);
  }

  // Tags
  if (state.filters.tags.length > 0) {
    filtered = filtered.filter((doc) =>
      state.filters.tags.some((tag) => doc.tags.includes(tag))
    );
  }

  // Date Range
  if (state.filters.dateRange) {
    filtered = filtered.filter((doc) => {
      const docDate = new Date(doc.createdAt);
      return (
        docDate >= state.filters.dateRange!.from &&
        docDate <= state.filters.dateRange!.to
      );
    });
  }

  return filtered;
};

export const selectPaginatedDocuments = (state: DocumentState) => {
  const filtered = selectFilteredDocuments(state);
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  return filtered.slice(start, end);
};
