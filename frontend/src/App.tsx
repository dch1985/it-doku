import React, { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DeleteConfirmation from './components/DeleteConfirmation';
import { Document } from './api/documents';

// Dark Mode Hook
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return { isDarkMode, toggleDarkMode };
};

// Icons
const SunIcon: React.FC = () => (
  <svg
    className="dark-mode-toggle-icon dark-mode-toggle-icon--sun"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg
    className="dark-mode-toggle-icon dark-mode-toggle-icon--moon"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ScannerIcon: React.FC = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Main App Component
const App: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showScanner, setShowScanner] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [view, setView] = useState<'documents' | 'scanner'>('documents');

  const handleNewDocument = () => {
    setEditingDocument(null);
    setShowDocumentForm(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowDocumentForm(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setDeletingDocument(document);
    setShowDeleteConfirmation(true);
  };

  const handleDocumentSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowDocumentForm(false);
    setEditingDocument(null);
  };

  const handleDeleteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowDeleteConfirmation(false);
    setDeletingDocument(null);
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-logo">
            IT Dokumentation
          </h1>

          <div className="header-actions">
            <button
              className="header-nav-btn"
              onClick={() => setView('documents')}
              style={{
                color: view === 'documents' ? 'var(--primary-blue)' : 'var(--text-secondary)',
              }}
              title="Dokumentationen"
            >
              📄 Dokumente
            </button>
            <button
              className="header-nav-btn"
              onClick={() => setView('scanner')}
              style={{
                color: view === 'scanner' ? 'var(--primary-blue)' : 'var(--text-secondary)',
              }}
              title="Verzeichnis Scanner"
            >
              <ScannerIcon />
              Scanner
            </button>
            <button
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              aria-label={`Zu ${isDarkMode ? 'hellem' : 'dunklem'} Modus wechseln`}
              title={`${isDarkMode ? 'Heller' : 'Dunkler'} Modus`}
            >
              <SunIcon />
              <MoonIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {view === 'documents' ? (
          <>
            {/* Hero Section */}
            <section className="hero-section">
              <div className="container">
                <div className="hero-content">
                  <h2 className="hero-title">
                    IT-Dokumentations-Management
                  </h2>
                  <p className="hero-description">
                    Erstelle, verwalte und organisiere deine IT-Dokumentationen mit
                    NIST-konformen Templates. Professionell, strukturiert und effizient.
                  </p>
                </div>
              </div>
            </section>

            {/* Document List */}
            <section className="main-content">
              <DocumentList
                onEdit={handleEditDocument}
                onDelete={handleDeleteDocument}
                refreshTrigger={refreshTrigger}
              />
            </section>
          </>
        ) : (
          <>
            {/* Scanner Section */}
            <section className="hero-section">
              <div className="container">
                <div className="hero-content">
                  <h2 className="hero-title">
                    Verzeichnis Scanner
                  </h2>
                  <p className="hero-description">
                    Scanne lokale Verzeichnisse und identifiziere automatisch IT-relevante Dateien.
                  </p>
                </div>
              </div>
            </section>

            {/* Scanner Component */}
            <section className="main-content">
              <Scanner onClose={() => {}} />
            </section>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      {view === 'documents' && (
        <button
          className="fab"
          onClick={handleNewDocument}
          aria-label="Neues Dokument erstellen"
          title="Neues Dokument"
        >
          <PlusIcon />
        </button>
      )}

      {/* Modals */}
      {showDocumentForm && (
        <DocumentForm
          document={editingDocument}
          onClose={() => {
            setShowDocumentForm(false);
            setEditingDocument(null);
          }}
          onSuccess={handleDocumentSuccess}
        />
      )}

      {showDeleteConfirmation && deletingDocument && (
        <DeleteConfirmation
          document={deletingDocument}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setDeletingDocument(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default App;
