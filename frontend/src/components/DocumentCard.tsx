/**
 * DocumentCard Component (OPTIMIZED with React.memo)
 * Einzelne Dokument-Karte mit Actions & Dark Mode
 * Memoized um unnötige Re-renders zu vermeiden
 */

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Calendar, User, FileText } from 'lucide-react';
import { Document, DocumentStatus } from '../types/document';

interface DocumentCardProps {
  document: Document;
  onEdit: (document: Document) => void;
  onDelete: (id: string) => void;
  onView?: (document: Document) => void;
  viewMode?: 'grid' | 'list';
}

const DocumentCardComponent: React.FC<DocumentCardProps> = ({
  document,
  onEdit,
  onDelete,
  onView,
  viewMode = 'grid',
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

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className="flex-1 cursor-pointer"
              onClick={handleViewClick}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                {document.title}
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                {document.category}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
              document.status
            )}`}
          >
            {getStatusLabel(document.status)}
          </span>

          {/* Content Preview */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-4 mb-4 line-clamp-3">
            {truncateContent(document.content, 120)}
          </p>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {document.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
              {document.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  +{document.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {/* Meta Info */}
          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{document.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(document.updatedAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleViewClick}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Anzeigen"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(document)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(document.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h3
                  className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer mb-2"
                  onClick={handleViewClick}
                >
                  {document.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {document.author}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(document.updatedAt)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    {document.category}
                  </span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    document.status
                  )}`}
                >
                  {getStatusLabel(document.status)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleViewClick}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Anzeigen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(document)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(document.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
              {truncateContent(document.content, 200)}
            </p>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {document.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
                {document.tags.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    +{document.tags.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
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
