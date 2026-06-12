// Central export for all stores
export { useAppStore } from './useAppStore';
export { useDocumentStore, selectFilteredDocuments, selectPaginatedDocuments } from './useDocumentStore';

// Re-export types
export type { Document, DocumentFilters } from './useDocumentStore';
