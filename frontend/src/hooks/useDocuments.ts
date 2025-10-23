/**
 * useDocuments Hook
 * Custom React Hook für Document State Management (FIXED)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { documentService } from '../services/document.service';
import {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentFilters,
  DocumentStatus,
  DocumentStats,
} from '../types/document';

interface UseDocumentsReturn {
  // State
  documents: Document[];
  loading: boolean;
  error: string | null;
  filters: DocumentFilters;
  stats: DocumentStats | null;
  
  // Computed
  filteredDocuments: Document[];
  documentsByCategory: Record<string, Document[]>;
  documentsByStatus: Record<DocumentStatus, Document[]>;
  totalDocuments: number;
  
  // Methods
  fetchDocuments: () => Promise<void>;
  fetchDocumentById: (id: string) => Promise<Document | null>;
  createDocument: (data: CreateDocumentDTO) => Promise<Document | null>;
  updateDocument: (id: string, data: UpdateDocumentDTO) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  
  // Filter Methods
  setFilters: (filters: Partial<DocumentFilters>) => void;
  clearFilters: () => void;
  filterByCategory: (category: string) => void;
  filterByStatus: (status: DocumentStatus) => void;
  filterByTags: (tags: string[]) => void;
  searchDocuments: (searchTerm: string) => void;
  
  // Utility Methods
  refreshDocuments: () => Promise<void>;
  clearError: () => void;
}

/**
 * useDocuments Custom Hook
 */
export const useDocuments = (autoFetch: boolean = true): UseDocumentsReturn => {
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DocumentFilters>({});
  const [stats, setStats] = useState<DocumentStats | null>(null);
  
  // Ref to track if initial fetch happened
  const initialFetchDone = useRef(false);

  /**
   * Dokumente vom Backend laden
   * FIXED: Entfernt filters aus dependencies
   */
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verwende leeres Objekt statt filters für client-seitige Filterung
      const response = await documentService.getAll({});
      setDocuments(response.documents);
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Laden der Dokumente';
      setError(errorMessage);
      console.error('Error fetching documents:', err);
      setDocuments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []); // FIXED: Keine dependencies mehr

  /**
   * Einzelnes Dokument laden
   */
  const fetchDocumentById = useCallback(async (id: string): Promise<Document | null> => {
    if (!id) {
      setError('Ungültige Dokument-ID');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const document = await documentService.getById(id);
      return document;
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Laden des Dokuments';
      setError(errorMessage);
      console.error('Error fetching document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Neues Dokument erstellen
   */
  const createDocument = useCallback(async (data: CreateDocumentDTO): Promise<Document | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newDocument = await documentService.create(data);
      setDocuments(prev => [newDocument, ...prev]); // Add to beginning
      return newDocument;
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Erstellen des Dokuments';
      setError(errorMessage);
      console.error('Error creating document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Dokument aktualisieren
   */
  const updateDocument = useCallback(async (
    id: string,
    data: UpdateDocumentDTO
  ): Promise<Document | null> => {
    if (!id) {
      setError('Ungültige Dokument-ID');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedDocument = await documentService.update(id, data);
      setDocuments(prev =>
        prev.map(doc => (doc.id === id ? updatedDocument : doc))
      );
      return updatedDocument;
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Aktualisieren des Dokuments';
      setError(errorMessage);
      console.error('Error updating document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Dokument löschen
   */
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    if (!id) {
      setError('Ungültige Dokument-ID');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      await documentService.delete(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Löschen des Dokuments';
      setError(errorMessage);
      console.error('Error deleting document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Statistiken laden
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await documentService.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      // Don't set error state for stats - it's not critical
    }
  }, []);

  /**
   * Filter setzen
   */
  const setFilters = useCallback((newFilters: Partial<DocumentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Filter zurücksetzen
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  /**
   * Nach Kategorie filtern
   */
  const filterByCategory = useCallback((category: string) => {
    setFilters({ category });
  }, [setFilters]);

  /**
   * Nach Status filtern
   */
  const filterByStatus = useCallback((status: DocumentStatus) => {
    setFilters({ status });
  }, [setFilters]);

  /**
   * Nach Tags filtern
   */
  const filterByTags = useCallback((tags: string[]) => {
    setFilters({ tags });
  }, [setFilters]);

  /**
   * Dokumente suchen
   */
  const searchDocuments = useCallback((searchTerm: string) => {
    setFilters({ searchTerm });
  }, [setFilters]);

  /**
   * Dokumente neu laden
   */
  const refreshDocuments = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  /**
   * Fehler zurücksetzen
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed Properties

  /**
   * Gefilterte Dokumente (Client-seitig)
   * FIXED: Bessere Type Safety
   */
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Suche
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(
        doc =>
          doc.title.toLowerCase().includes(term) ||
          doc.content.toLowerCase().includes(term) ||
          doc.category.toLowerCase().includes(term) ||
          doc.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Kategorie
    if (filters.category) {
      result = result.filter(doc => doc.category === filters.category);
    }

    // Status
    if (filters.status) {
      result = result.filter(doc => doc.status === filters.status);
    }

    // Tags
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(doc =>
        filters.tags!.some(tag => doc.tags.includes(tag))
      );
    }

    // Sortierung - FIXED: Better type safety
    if (filters.sortBy) {
      result.sort((a, b) => {
        const sortBy = filters.sortBy as keyof Document;
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle different types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return filters.sortOrder === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Fallback for dates
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [documents, filters]);

  /**
   * Dokumente nach Kategorie gruppiert
   */
  const documentsByCategory = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const category = doc.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  }, [documents]);

  /**
   * Dokumente nach Status gruppiert
   */
  const documentsByStatus = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const status = doc.status || DocumentStatus.DRAFT;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(doc);
      return acc;
    }, {} as Record<DocumentStatus, Document[]>);
  }, [documents]);

  /**
   * Gesamtanzahl der Dokumente
   */
  const totalDocuments = useMemo(() => documents.length, [documents.length]);

  // Effects

  /**
   * Initial Load - FIXED: Only run once
   */
  useEffect(() => {
    if (autoFetch && !initialFetchDone.current) {
      fetchDocuments();
      initialFetchDone.current = true;
    }
  }, [autoFetch, fetchDocuments]);

  // Return
  return {
    // State
    documents,
    loading,
    error,
    filters,
    stats,
    
    // Computed
    filteredDocuments,
    documentsByCategory,
    documentsByStatus,
    totalDocuments,
    
    // Methods
    fetchDocuments,
    fetchDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    fetchStats,
    
    // Filter Methods
    setFilters,
    clearFilters,
    filterByCategory,
    filterByStatus,
    filterByTags,
    searchDocuments,
    
    // Utility Methods
    refreshDocuments,
    clearError,
  };
};

export default useDocuments;
