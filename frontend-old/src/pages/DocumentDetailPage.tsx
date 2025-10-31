/**
 * DocumentDetailPage Component
 * Detailansicht mit PDF Export und Markdown Rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { documentService } from '../services/document.service';
import { Document, DocumentStatus } from '../types/document';
import { DocumentForm } from '../components/DocumentForm';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { exportDocumentToPDF } from '../utils/pdfExport';
import { showToast } from '../utils/toast';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (docId: string) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await documentService.getById(docId);
      setDocument(doc);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden des Dokuments');
      showToast.error('Dokument konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      try {
        await documentService.delete(id);
        showToast.success('Dokument erfolgreich gelöscht');
        navigate('/documents');
      } catch (err: any) {
        setError(err.message || 'Fehler beim Löschen des Dokuments');
        showToast.error('Dokument konnte nicht gelöscht werden');
      }
    }
  };

  const handleExportPDF = async () => {
    if (!document) return;
    
    setIsExporting(true);
    try {
      await exportDocumentToPDF(document);
      showToast.success('PDF erfolgreich exportiert!');
    } catch (err: any) {
      showToast.error('Fehler beim PDF-Export');
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      const updated = await documentService.update(id, data);
      setDocument(updated);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Dokuments');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status?: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case DocumentStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case DocumentStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusLabel = (status?: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.PUBLISHED:
        return 'Veröffentlicht';
      case DocumentStatus.DRAFT:
        return 'Entwurf';
      case DocumentStatus.ARCHIVED:
        return 'Archiviert';
      default:
        return 'Unbekannt';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
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
          <p className="text-gray-600 dark:text-gray-300">Dokument wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Fehler</h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error || 'Dokument nicht gefunden'}</p>
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Zurück zur Übersicht
            </Link>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link
                to="/dashboard"
                className="px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                📊 Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {document.title}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                    document.status
                  )}`}
                >
                  {getStatusLabel(document.status)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800">
                  📁 {document.category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="p-3 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Als PDF exportieren"
              >
                {isExporting ? (
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={handleEdit}
                className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Bearbeiten"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Löschen"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Autor</p>
              <p className="font-medium text-gray-900 dark:text-white">👤 {document.author}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Erstellt am</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(document.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Zuletzt aktualisiert</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(document.updatedAt)}
              </p>
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Section with Markdown Rendering */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inhalt</h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {document.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {document && (
        <DocumentForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleFormSubmit}
          document={document}
          mode="edit"
        />
      )}
    </div>
  );
};

export default DocumentDetailPage;
