/**
 * DocumentForm Component
 * Modal für Create/Edit mit Markdown Editor
 */

import React, { useState, useEffect } from 'react';
import {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentStatus,
} from '../types/document';
import { MarkdownEditor } from './MarkdownEditor';
import { FileUpload } from './FileUpload';
import { showToast } from '../utils/toast';

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDocumentDTO | UpdateDocumentDTO) => Promise<void>;
  document?: Document | null;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  content: string;
  category: string;
  tags: string;
  author: string;
  status: DocumentStatus;
}

interface FormErrors {
  title?: string;
  content?: string;
  category?: string;
  author?: string;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  document,
  mode,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    category: '',
    tags: '',
    author: '',
    status: DocumentStatus.DRAFT,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && document) {
      setFormData({
        title: document.title,
        content: document.content,
        category: document.category,
        tags: document.tags?.join(', ') || '',
        author: document.author,
        status: document.status || DocumentStatus.DRAFT,
      });
    } else {
      resetForm();
    }
  }, [mode, document]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
      author: '',
      status: DocumentStatus.DRAFT,
    });
    setErrors({});
    setShowFileUpload(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Inhalt muss mindestens 10 Zeichen lang sein';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Kategorie ist erforderlich';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Autor ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setLoading(true);

    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category.trim(),
        tags,
        author: formData.author.trim(),
        status: formData.status,
      };

      await onSubmit(submitData);
      showToast.success(
        mode === 'create'
          ? 'Dokument erfolgreich erstellt!'
          : 'Dokument erfolgreich aktualisiert!'
      );
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast.error('Fehler beim Speichern des Dokuments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleMarkdownChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    showToast.info(`${files.length} Datei(en) ausgewählt`);
    // TODO: Implement file upload to backend
    console.log('Selected files:', files);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'create' ? '📝 Neues Dokument erstellen' : '✏️ Dokument bearbeiten'}
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={loading}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6 dark:bg-gray-800">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dokumententitel eingeben..."
                  disabled={loading}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategorie <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="z.B. Server, Netzwerk..."
                    disabled={loading}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  >
                    <option value={DocumentStatus.DRAFT}>Entwurf</option>
                    <option value={DocumentStatus.PUBLISHED}>Veröffentlicht</option>
                    <option value={DocumentStatus.ARCHIVED}>Archiviert</option>
                  </select>
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.author ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ihr Name..."
                  disabled={loading}
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-500">{errors.author}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (durch Komma getrennt)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="z.B. wichtig, dringend, projekt-x"
                  disabled={loading}
                />
              </div>

              {/* Markdown Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inhalt (Markdown) <span className="text-red-500">*</span>
                </label>
                <MarkdownEditor
                  value={formData.content}
                  onChange={handleMarkdownChange}
                  placeholder="Dokumenteninhalt mit Markdown-Formatierung eingeben..."
                  height={400}
                  disabled={loading}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                )}
              </div>

              {/* File Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dateianhänge (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {showFileUpload ? '▼ Ausblenden' : '▶ Dateien anhängen'}
                  </button>
                </div>
                {showFileUpload && (
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tipp: Drücke <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> zum Schließen
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      {mode === 'create' ? '💾 Erstellen' : '💾 Speichern'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;
