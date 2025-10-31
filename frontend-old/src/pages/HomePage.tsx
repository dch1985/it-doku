/**
 * HomePage Component
 * Landing Page mit IT-Themen-Karten, Dark Mode & Keyboard Shortcuts
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { useDarkMode } from '../context/DarkModeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface TopicData {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: string;
  link: string;
}

const topicsData: TopicData[] = [
  {
    id: 'server',
    title: 'Serveradministration',
    icon: '🖥️',
    description: 'Linux & Windows Server Management, Virtualisierung und Cloud-Services.',
    category: 'server',
    link: '/documents?category=Server'
  },
  {
    id: 'network',
    title: 'Netzwerk',
    icon: '🌐',
    description: 'Switches, Router & Firewall Konfiguration, VPN und Netzwerksicherheit.',
    category: 'network',
    link: '/documents?category=Netzwerk'
  },
  {
    id: 'security',
    title: 'Sicherheit',
    icon: '🔒',
    description: 'Security Guidelines, Penetration Testing und Compliance-Standards.',
    category: 'security',
    link: '/documents?category=Sicherheit'
  },
  {
    id: 'backup',
    title: 'Backup & Recovery',
    icon: '💾',
    description: 'Datensicherung, Disaster Recovery und Business Continuity Planning.',
    category: 'backup',
    link: '/documents?category=Backup'
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: '📊',
    description: 'System- & Netzwerk-Überwachung, Alerting und Performance-Analyse.',
    category: 'monitoring',
    link: '/documents?category=Monitoring'
  },
  {
    id: 'troubleshoot',
    title: 'Troubleshooting',
    icon: '🔧',
    description: 'Problemlösung, Diagnose-Tools und systematische Fehleranalyse.',
    category: 'troubleshoot',
    link: '/documents?category=Troubleshooting'
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toggleDarkMode } = useDarkMode();

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onNewDocument: () => navigate('/documents'),
    onToggleDarkMode: toggleDarkMode,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">📚</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IT-Dokumentation</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Zentrale Anlaufstelle für alle technischen Dokumentationen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link
                to="/dashboard"
                className="px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
              >
                <span>📊</span>
                Dashboard
              </Link>
              <Link
                to="/documents"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Alle Dokumente
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen zur IT-Dokumentation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Professionell organisiert für maximale Effizienz in der IT-Administration.
            Wähle einen Bereich aus, um die entsprechenden Dokumentationen zu sehen.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              N
            </kbd>
            <span>Neues Dokument</span>
            <span className="text-gray-400">•</span>
            <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              Ctrl+D
            </kbd>
            <span>Dark Mode</span>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topicsData.map((topic, index) => (
            <Link
              key={topic.id}
              to={topic.link}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-1"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Dokumentationen ansehen</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Status Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            System Status
          </h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
              ✅ Alle Services Online
            </span>
            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
              ℹ️ Wartung geplant: 23:00
            </span>
            <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-200 dark:border-yellow-800">
              ⚠️ Updates verfügbar
            </span>
          </div>
        </div>
      </section>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
