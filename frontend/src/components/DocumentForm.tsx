import React, { useState, useEffect } from 'react';
import { documentsAPI, Document, Template, CreateDocumentInput } from '../api/documents';

interface DocumentFormProps {
  document?: Document | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CloseIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DocumentForm: React.FC<DocumentFormProps> = ({ document, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('server');
  const [status, setStatus] = useState('draft');
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const isEditMode = !!document;

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await documentsAPI.getAllTemplates();
        setTemplates(response.templates);
      } catch (err) {
        console.error('Fehler beim Laden der Templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Fill form when editing
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setCategory(document.category);
      setStatus(document.status);
      setTemplateId(document.templateId || '');
    }
  }, [document]);

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (!title) {
        setTitle(template.title);
      }
      setContent(template.content);
      setCategory(template.category);
      setTemplateId(template.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Titel und Inhalt sind erforderlich');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: CreateDocumentInput = {
        title: title.trim(),
        content: content.trim(),
        category,
        status,
        templateId: templateId || undefined,
      };

      if (isEditMode && document) {
        await documentsAPI.updateDocument(document.id, data);
      } else {
        await documentsAPI.createDocument(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditMode ? 'Dokument bearbeiten' : 'Neues Dokument erstellen'}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Schließen"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="document-form">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Template Selection (nur bei neuem Dokument) */}
          {!isEditMode && (
            <div className="form-group">
              <label htmlFor="template-select" className="form-label">
                Template verwenden (optional)
              </label>
              {loadingTemplates ? (
                <p className="form-help">Lade Templates...</p>
              ) : (
                <>
                  <select
                    id="template-select"
                    className="form-input"
                    value={templateId}
                    onChange={(e) => {
                      setTemplateId(e.target.value);
                      if (e.target.value) {
                        applyTemplate(e.target.value);
                      }
                    }}
                  >
                    <option value="">-- Kein Template --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.category})
                      </option>
                    ))}
                  </select>
                  <small className="form-help">
                    Wähle ein Template aus, um mit einer Vorlage zu starten
                  </small>
                </>
              )}
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="doc-title" className="form-label required">
              Titel
            </label>
            <input
              id="doc-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Webserver-01 Dokumentation"
              required
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="doc-category" className="form-label required">
              Kategorie
            </label>
            <select
              id="doc-category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
            >
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

          {/* Status */}
          <div className="form-group">
            <label htmlFor="doc-status" className="form-label">
              Status
            </label>
            <select
              id="doc-status"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="draft">Entwurf</option>
              <option value="review">In Prüfung</option>
              <option value="approved">Freigegeben</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="doc-content" className="form-label required">
              Inhalt
            </label>
            <textarea
              id="doc-content"
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dokumentationsinhalt in Markdown..."
              rows={15}
              required
              disabled={loading}
            />
            <small className="form-help">
              Markdown-Formatierung wird unterstützt
            </small>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Speichere...' : isEditMode ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm;
