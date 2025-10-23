import React, { useState } from 'react';
import { documentsAPI, Document } from '../api/documents';

interface DeleteConfirmationProps {
  document: Document;
  onClose: () => void;
  onSuccess: () => void;
}

const WarningIcon = () => (
  <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ document, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await documentsAPI.deleteDocument(document.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirmation">
          <div className="delete-confirmation-icon">
            <WarningIcon />
          </div>

          <h2 className="delete-confirmation-title">
            Dokument löschen?
          </h2>

          <p className="delete-confirmation-message">
            Möchtest du das Dokument <strong>"{document.title}"</strong> wirklich löschen?
          </p>

          <p className="delete-confirmation-warning">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

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
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Lösche...' : 'Löschen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
