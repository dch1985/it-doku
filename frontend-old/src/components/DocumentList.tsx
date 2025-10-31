/**
 * DocumentList Component (OPTIMIZED)
 * Mit Debouncing, Logger & Performance-Optimierungen
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { useDebounce } from '../hooks/useDebounce';
import { DocumentCard } from './DocumentCard';
import { DocumentForm } from './DocumentForm';
import { useDarkMode } from '../context/DarkModeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { showToast } from '../utils/toast';
import logger from '../utils/logger';
import {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentStatus,
} from '../types/document';

export const DocumentList: React.FC = () => {
  const {
    filteredDocuments,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    filterByCategory,
    filterByStatus,
    searchDocuments,
    clearFilters,
    documentsByCategory,
    totalDocuments,
  } = useDocuments();

  const { toggleDarkMode } = useDarkMode();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Debounce search term - only search after 300ms of no typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      logger.debug('Performing debounced search:', debouncedSearchTerm);
      searchDocuments(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchDocuments]);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onNewDocument: () => handleCreateNew(),
    onSearch: () => searchInputRef.current?.focus(),
    onToggleDarkMode: toggleDarkMode,
    onEscape: () => setIsFormOpen(false),
  });

  

  const handleCreateNew = () => {
    logger.info('Opening document form in create mode');
    setFormMode('create');
    setSelectedDocument(null);
    setIsFormOpen(true);
  };

  const handleEdit = (document: Document) => {
    logger.info('Opening document form in edit mode:', document.id);
    setFormMode('edit');
    setSelectedDocument(document);
    setIsFormOpen(true);
  };
const categories = Object.keys(documentsByCategory || {}).sort();

  const handleDelete = async (id: string) => {
    logger.info('Attempting to delete document:', id);
    try {
      const success = await deleteDocument(id);
      if (success) {
        showToast.success('Dokument erfolgreich gelöscht');
        logger.info('Document deleted successfully:', id);
      }
    } catch (error) {
      logger.error('Failed to delete document:', error);
      showToast.error('Fehler beim Löschen des Dokuments');
    }
  };

  const handleFormSubmit = async (data: CreateDocumentDTO | UpdateDocumentDTO) => {
    logger.info('Submitting document form:', { mode: formMode });
    try {
      if (formMode === 'create') {
        await createDocument(data as CreateDocumentDTO);
      } else if (selectedDocument) {
        await updateDocument(selectedDocument.id, data as UpdateDocumentDTO);
      }
    } catch (error) {
      logger.error('Form submission failed:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // searchDocuments is called by debounced effect, not here
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    logger.debug('Category filter changed:', value);
    setSelectedCategory(value);
    if (value) {
      filterByCategory(value);
    } else {
      clearFilters();
    }
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DocumentStatus;
    logger.debug('Status filter changed:', value);
    setSelectedStatus(value);
    if (value) {
      filterByStatus(value);
    } else {
      clearFilters();
    }
  };

  const handleClearFilters = () => {
    logger.info('Clearing all filters');
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    clearFilters();
    showToast.info('Filter zurückgesetzt');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                📚 IT-Dokumentation
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalte und organisiere deine IT-Dokumente
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Neues Dokument
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalDocuments}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Dokumente gesamt</span>
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {categories.length}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">Kategorien</span>
                </div>
              </div>
              {(searchTerm || selectedCategory || selectedStatus) && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  🔄 Filter zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search - WITH DEBOUNCING */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔍 Suche {searchTerm && debouncedSearchTerm !== searchTerm && (
                    <span className="text-xs text-gray-500 ml-2">(suche...)</span>
                  )}
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Dokumente durchsuchen... (Ctrl+K)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📁 Kategorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryFilter}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Alle Kategorien</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category} ({documentsByCategory[category].length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏷️ Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={handleStatusFilter}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Alle Status</option>
                  <option value={DocumentStatus.DRAFT}>Entwurf</option>
                  <option value={DocumentStatus.PUBLISHED}>Veröffentlicht</option>
                  <option value={DocumentStatus.ARCHIVED}>Archiviert</option>
                </select>
              </div>
            </div>
            
            {/* Keyboard Shortcuts Hint */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>⌨️ Shortcuts:</span>
                <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">N</kbd> Neues Dokument</span>
                <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd> Suche</span>
                <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+D</kbd> Dark Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">Fehler</h3>
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-300">Dokumente werden geladen...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDocuments.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Dokumente gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || selectedCategory || selectedStatus
                ? 'Versuche es mit anderen Filtereinstellungen'
                : 'Erstelle dein erstes Dokument, um loszulegen'}
            </p>
            {!searchTerm && !selectedCategory && !selectedStatus && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Erstes Dokument erstellen
              </button>
            )}
          </div>
        )}

        {/* Document Grid */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map(document => (
              <DocumentCard
                key={document.id}
                document={document}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Form Modal */}
      <DocumentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        document={selectedDocument}
        mode={formMode}
      />
    </div>
  );
};

export default DocumentList;
