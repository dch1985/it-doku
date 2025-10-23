/**
 * DocumentCard Component (OPTIMIZED with React.memo)
 * Einzelne Dokument-Karte mit Actions & Dark Mode
 * Memoized um unnötige Re-renders zu vermeiden
 */

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, DocumentStatus } from '../types/document';

interface DocumentCardProps {
  document: Document;
  onEdit: (document: Document) => void;
  onDelete: (id: string) => void;
  onView?: (document: Document) => void;
}

const DocumentCardComponent: React.FC<DocumentCardProps> = ({
  document,
  onEdit,
  onDelete,
  onView,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status?: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.PUBLISHED:
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case DocumentStatus.DRAFT:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case DocumentStatus.ARCHIVED:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleViewClick = () => {
    if (onView) {
      onView(document);
    } else {
      navigate(`/documents/${document.id}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <h3 
            className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
            onClick={handleViewClick}
          >
            {document.title}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
              document.status
            )}`}
          >
            {getStatusLabel(document.status)}
          </span>
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800">
            📁 {document.category}
          </span>
        </div>

        {/* Content Preview */}
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
          {truncateContent(document.content)}
        </p>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        {/* Meta Info */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span className="font-medium">👤 {document.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅 {formatDate(document.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewClick}
            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Anzeigen"
          >
            👁️
          </button>
          <button
            onClick={() => onEdit(document)}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Bearbeiten"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
                onDelete(document.id);
              }
            }}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Löschen"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom comparison function für React.memo
 * Vergleicht nur relevante Props für Re-rendering
 */
const propsAreEqual = (
  prevProps: DocumentCardProps,
  nextProps: DocumentCardProps
): boolean => {
  // Document comparison
  if (prevProps.document.id !== nextProps.document.id) return false;
  if (prevProps.document.title !== nextProps.document.title) return false;
  if (prevProps.document.content !== nextProps.document.content) return false;
  if (prevProps.document.status !== nextProps.document.status) return false;
  if (prevProps.document.category !== nextProps.document.category) return false;
  if (prevProps.document.author !== nextProps.document.author) return false;
  if (prevProps.document.updatedAt !== nextProps.document.updatedAt) return false;
  
  // Tags comparison (shallow)
  const prevTags = prevProps.document.tags || [];
  const nextTags = nextProps.document.tags || [];
  if (prevTags.length !== nextTags.length) return false;
  if (prevTags.some((tag, i) => tag !== nextTags[i])) return false;
  
  // Callbacks werden als gleich behandelt (funktionale Identität wird nicht geprüft)
  // Dies verhindert Re-renders bei Parent-Updates
  return true;
};

/**
 * Memoized DocumentCard für bessere Performance
 * Rendert nur neu wenn sich die Dokument-Daten ändern
 */
export const DocumentCard = memo(DocumentCardComponent, propsAreEqual);

export default DocumentCard;
