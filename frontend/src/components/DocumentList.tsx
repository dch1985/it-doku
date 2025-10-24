import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Grid,
  List,
  SortAsc,
  X,
  FolderOpen,
  CheckCircle2,
  Clock,
  Archive
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useDebounce } from '../hooks/useDebounce';
import { DocumentCard } from './DocumentCard';
import { DocumentForm } from './DocumentForm';
import { showToast } from '../utils/toast';
import { logger } from '../utils/logger';
import {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentStatus,
} from '../types/document';

export function DocumentList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    documentsByStatus,
    totalDocuments,
  } = useDocuments();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');

  // Debounce search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      searchDocuments(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchDocuments]);

  // Check URL params for actions
  useEffect(() => {
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (action === 'new') {
      handleCreateNew();
    }
    if (category) {
      setSelectedCategory(category);
      filterByCategory(category);
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const categories = Object.keys(documentsByCategory || {}).sort();

  const stats = {
    total: totalDocuments,
    published: documentsByStatus[DocumentStatus.PUBLISHED]?.length || 0,
    drafts: documentsByStatus[DocumentStatus.DRAFT]?.length || 0,
    archived: documentsByStatus[DocumentStatus.ARCHIVED]?.length || 0,
  };

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

  const handleDelete = async (id: string) => {
    logger.info('Attempting to delete document:', id);
    if (!confirm('Möchtest du dieses Dokument wirklich löschen?')) return;

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
        showToast.success('Dokument erfolgreich erstellt');
      } else if (selectedDocument) {
        await updateDocument(selectedDocument.id, data as UpdateDocumentDTO);
        showToast.success('Dokument erfolgreich aktualisiert');
      }
      setIsFormOpen(false);
    } catch (error) {
      logger.error('Form submission failed:', error);
      showToast.error('Fehler beim Speichern des Dokuments');
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category) {
      filterByCategory(category);
    } else {
      clearFilters();
    }
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    if (status) {
      filterByStatus(status as DocumentStatus);
    } else {
      clearFilters();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    clearFilters();
    showToast.info('Filter zurückgesetzt');
  };

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Dokumente werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                Dokumente
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalte und organisiere deine IT-Dokumentationen
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Neues Dokument
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Gesamt</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Veröffentlicht</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.drafts}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Entwürfe</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archived}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Archiviert</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Dokumente durchsuchen..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
              >
                <option value="">Alle Kategorien</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category} ({documentsByCategory[category].length})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
              >
                <option value="">Alle Status</option>
                <option value={DocumentStatus.PUBLISHED}>Veröffentlicht</option>
                <option value={DocumentStatus.DRAFT}>Entwurf</option>
                <option value={DocumentStatus.ARCHIVED}>Archiviert</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
              >
                <option value="date">Nach Datum</option>
                <option value="title">Nach Titel</option>
                <option value="category">Nach Kategorie</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl border transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl border transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || selectedCategory || selectedStatus) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aktive Filter:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      Suche: {searchTerm}
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm">
                      {selectedStatus}
                    </span>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Alle Filter entfernen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Fehler beim Laden</h3>
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedDocuments.length === 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg"
              >
                Erstes Dokument erstellen
              </button>
            )}
          </div>
        )}

        {/* Document Grid/List */}
        {!loading && sortedDocuments.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {sortedDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onEdit={handleEdit}
                onDelete={handleDelete}
                viewMode={viewMode}
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
}

export default DocumentList;
