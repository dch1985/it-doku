import React, { useState, useEffect } from 'react';
import { documentsAPI, Document } from '../api/documents';

interface DocumentListProps {
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
  refreshTrigger?: number;
}

const DocumentIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'server': 'Server',
    'network': 'Netzwerk',
    'security': 'Sicherheit',
    'backup': 'Backup',
    'monitoring': 'Monitoring',
    'troubleshoot': 'Troubleshooting',
    'incident': 'Incident',
    'change': 'Change',
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'server': '#3b82f6',
    'network': '#10b981',
    'security': '#ef4444',
    'backup': '#f59e0b',
    'monitoring': '#8b5cf6',
    'troubleshoot': '#06b6d4',
    'incident': '#ec4899',
    'change': '#14b8a6',
  };
  return colors[category] || '#6b7280';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'draft': 'Entwurf',
    'review': 'In Prüfung',
    'approved': 'Freigegeben',
    'archived': 'Archiviert',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'draft': '#6b7280',
    'review': '#f59e0b',
    'approved': '#10b981',
    'archived': '#9ca3af',
  };
  return colors[status] || '#6b7280';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DocumentList: React.FC<DocumentListProps> = ({ onEdit, onDelete, refreshTrigger }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (filterStatus !== 'all') filters.status = filterStatus;

      const response = await documentsAPI.getAllDocuments(filters);
      setDocuments(response.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filterCategory, filterStatus, refreshTrigger]);

  if (loading) {
    return (
      <div className="document-list-loading">
        <div className="spinner"></div>
        <p>Lade Dokumente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <strong>Fehler:</strong> {error}
        <button className="btn btn-secondary" onClick={loadDocuments}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="document-list-container">
      {/* Filter */}
      <div className="document-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Kategorie:</label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle Kategorien</option>
            <option value="server">Server</option>
            <option value="network">Netzwerk</option>
            <option value="security">Sicherheit</option>
            <option value="backup">Backup</option>
            <option value="monitoring">Monitoring</option>
            <option value="troubleshoot">Troubleshooting</option>
            <option value="incident">Incident</option>
            <option value="change">Change</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="review">In Prüfung</option>
            <option value="approved">Freigegeben</option>
            <option value="archived">Archiviert</option>
          </select>
        </div>

        <div className="filter-info">
          {documents.length} Dokument{documents.length !== 1 ? 'e' : ''}
        </div>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="empty-state">
          <DocumentIcon />
          <h3>Keine Dokumente gefunden</h3>
          <p>Erstelle dein erstes Dokument mit dem Plus-Button</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-card-header">
                <div className="document-icon">
                  <DocumentIcon />
                </div>
                <div className="document-badges">
                  <span
                    className="document-badge"
                    style={{ backgroundColor: getCategoryColor(doc.category) }}
                  >
                    {getCategoryLabel(doc.category)}
                  </span>
                  <span
                    className="document-badge"
                    style={{ backgroundColor: getStatusColor(doc.status) }}
                  >
                    {getStatusLabel(doc.status)}
                  </span>
                </div>
              </div>

              <div className="document-card-body">
                <h3 className="document-title">{doc.title}</h3>
                <p className="document-preview">
                  {doc.content.substring(0, 120)}...
                </p>
                {doc.template && (
                  <p className="document-template">
                    📋 Template: {doc.template.title}
                  </p>
                )}
              </div>

              <div className="document-card-footer">
                <div className="document-meta">
                  <small>Aktualisiert: {formatDate(doc.updatedAt)}</small>
                </div>
                <div className="document-actions">
                  <button
                    className="btn-icon btn-icon--edit"
                    onClick={() => onEdit(doc)}
                    title="Bearbeiten"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="btn-icon btn-icon--delete"
                    onClick={() => onDelete(doc)}
                    title="Löschen"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
