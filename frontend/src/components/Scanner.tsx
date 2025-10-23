import React, { useState } from 'react';
import { scannerAPI, ScanResponse, ScanResult } from '../api/scanner';

const ScannerIcon: React.FC = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    'configuration': '#3b82f6',
    'documentation': '#10b981',
    'script': '#f59e0b',
    'source-code': '#8b5cf6',
    'log': '#ef4444',
    'database': '#06b6d4',
    'container': '#ec4899',
    'infrastructure': '#14b8a6',
  };
  return colors[category || ''] || '#6b7280';
};

const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    'configuration': 'Konfiguration',
    'documentation': 'Dokumentation',
    'script': 'Script',
    'source-code': 'Quellcode',
    'log': 'Log',
    'database': 'Datenbank',
    'container': 'Container',
    'infrastructure': 'Infrastruktur',
  };
  return labels[category || ''] || category || 'Sonstiges';
};

interface ScannerProps {
  onClose?: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const [scanPath, setScanPath] = useState('C:\\Users\\DrissChaouat\\Code\\it-doku');
  const [maxDepth, setMaxDepth] = useState(3);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleScan = async () => {
    if (!scanPath.trim()) {
      setError('Bitte gib einen Pfad ein');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await scannerAPI.scanDirectory({
        path: scanPath,
        maxDepth,
        includeStatistics: true,
      });

      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsScanning(false);
    }
  };

  const filteredResults = scanResult?.results.filter(result => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'directories') return result.type === 'directory';
    if (selectedCategory === 'files') return result.type === 'file';
    return result.category === selectedCategory;
  }) || [];

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2 className="scanner-title">
          <ScannerIcon />
          Lokales Verzeichnis Scannen
        </h2>
        {onClose && (
          <button className="scanner-close" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        )}
      </div>

      <div className="scanner-form">
        <div className="form-group">
          <label htmlFor="scan-path" className="form-label">
            Verzeichnis-Pfad (Windows oder Unix)
          </label>
          <input
            id="scan-path"
            type="text"
            className="form-input"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="C:\Users\...\Code\Projekt oder /home/user/projekt"
            disabled={isScanning}
          />
          <small className="form-help">
            Beispiele: C:\Users\Name\Code\Projekt, /home/user/projekt, .\relative\path
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="max-depth" className="form-label">
            Maximale Scan-Tiefe: {maxDepth}
          </label>
          <input
            id="max-depth"
            type="range"
            min="1"
            max="10"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            disabled={isScanning}
            className="form-range"
          />
          <small className="form-help">
            Anzahl der Unterverzeichnis-Ebenen (1-10)
          </small>
        </div>

        <button
          className="btn btn-primary btn-scan"
          onClick={handleScan}
          disabled={isScanning}
        >
          {isScanning ? 'Scanne...' : 'Verzeichnis Scannen'}
        </button>

        {error && (
          <div className="alert alert-error">
            <strong>Fehler:</strong> {error}
          </div>
        )}
      </div>

      {scanResult && (
        <div className="scanner-results">
          {/* Statistics */}
          {scanResult.statistics && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{scanResult.statistics.totalFiles}</div>
                <div className="stat-label">Dateien</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{scanResult.statistics.totalDirectories}</div>
                <div className="stat-label">Verzeichnisse</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {scannerAPI.formatBytes(scanResult.statistics.totalSize)}
                </div>
                <div className="stat-label">Gesamtgröße</div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="category-filter">
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Alle ({scanResult.results.length})
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'files' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('files')}
            >
              Dateien ({scanResult.statistics?.totalFiles || 0})
            </button>
            <button
              className={`filter-btn ${selectedCategory === 'directories' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('directories')}
            >
              Verzeichnisse ({scanResult.statistics?.totalDirectories || 0})
            </button>
            {scanResult.statistics?.categories &&
              Object.entries(scanResult.statistics.categories).map(([cat, count]) => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    borderColor: selectedCategory === cat ? getCategoryColor(cat) : undefined
                  }}
                >
                  {getCategoryLabel(cat)} ({count})
                </button>
              ))
            }
          </div>

          {/* Results List */}
          <div className="results-list">
            {filteredResults.length === 0 ? (
              <div className="empty-state">
                Keine Ergebnisse für den gewählten Filter
              </div>
            ) : (
              filteredResults.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-icon">
                    {result.type === 'directory' ? <FolderIcon /> : <FileIcon />}
                  </div>
                  <div className="result-content">
                    <div className="result-name">{result.name}</div>
                    <div className="result-path">{result.path}</div>
                  </div>
                  <div className="result-meta">
                    {result.category && (
                      <span
                        className="result-badge"
                        style={{ backgroundColor: getCategoryColor(result.category) }}
                      >
                        {getCategoryLabel(result.category)}
                      </span>
                    )}
                    {result.size && (
                      <span className="result-size">
                        {scannerAPI.formatBytes(result.size)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
