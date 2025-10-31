/**
 * DashboardPage Component
 * Statistik-Dashboard mit erweiterten Metriken & Dark Mode
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { StatsCard } from '../components/StatsCard';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { DocumentStatus } from '../types/document';

export const DashboardPage: React.FC = () => {
  const {
    documents,
    loading,
    documentsByStatus,
    documentsByCategory,
    totalDocuments,
    fetchDocuments,
  } = useDocuments();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Statistiken berechnen
  const stats = {
    total: totalDocuments,
    published: documentsByStatus[DocumentStatus.PUBLISHED]?.length || 0,
    drafts: documentsByStatus[DocumentStatus.DRAFT]?.length || 0,
    archived: documentsByStatus[DocumentStatus.ARCHIVED]?.length || 0,
    categories: Object.keys(documentsByCategory).length,
  };

  // Letzte Dokumente (Top 5)
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Kategorie-Statistiken für Balkendiagramm
  const categoryStats = Object.entries(documentsByCategory)
    .map(([category, docs]) => ({
      category,
      count: docs.length,
      percentage: totalDocuments > 0 ? (docs.length / totalDocuments) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
          <p className="text-gray-600 dark:text-gray-300">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Übersicht über deine IT-Dokumentation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link
                to="/"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Startseite
              </Link>
              <Link
                to="/documents"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Alle Dokumente
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Dokumente Gesamt"
            value={stats.total}
            icon="📚"
            color="blue"
            subtitle="Alle Dokumente"
          />
          <StatsCard
            title="Veröffentlicht"
            value={stats.published}
            icon="✅"
            color="green"
            subtitle="Aktive Dokumente"
          />
          <StatsCard
            title="Entwürfe"
            value={stats.drafts}
            icon="📝"
            color="yellow"
            subtitle="In Bearbeitung"
          />
          <StatsCard
            title="Archiviert"
            value={stats.archived}
            icon="📦"
            color="gray"
            subtitle="Archivierte Dokumente"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kategorien-Verteilung */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📁 Dokumente nach Kategorie
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.categories} Kategorien
              </span>
            </div>

            {categoryStats.length > 0 ? (
              <div className="space-y-4">
                {categoryStats.map(({ category, count, percentage }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} Dokument{count !== 1 ? 'e' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Keine Kategorien vorhanden</p>
              </div>
            )}
          </div>

          {/* Schnellstatistiken */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              ⚡ Schnellstatistiken
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Durchschnitt</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {stats.categories > 0
                      ? Math.round(stats.total / stats.categories)
                      : 0}
                  </p>
                </div>
                <span className="text-2xl">📊</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Veröffentlichungsrate</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.total > 0
                      ? Math.round((stats.published / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <span className="text-2xl">📈</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entwurfsrate</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.total > 0
                      ? Math.round((stats.drafts / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Letzte Aktivitäten */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🕒 Letzte Aktivitäten
          </h2>

          {recentDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Titel
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Kategorie
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Autor
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Aktualisiert
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          {doc.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            doc.status === DocumentStatus.PUBLISHED
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                              : doc.status === DocumentStatus.DRAFT
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {doc.status === DocumentStatus.PUBLISHED
                            ? 'Veröffentlicht'
                            : doc.status === DocumentStatus.DRAFT
                            ? 'Entwurf'
                            : 'Archiviert'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {doc.author}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(doc.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Keine Dokumente vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
