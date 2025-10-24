import React, { useState, useEffect } from 'react';

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

// IT Topic Data
interface TopicData {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'server' | 'network' | 'security' | 'backup' | 'monitoring' | 'troubleshoot';
}

const topicsData: TopicData[] = [
  {
    id: 'server',
    title: 'Serveradministration',
    icon: '🖥️',
    description: 'Linux & Windows Server Management, Virtualisierung und Cloud-Services.',
    category: 'server'
  },
  {
    id: 'network',
    title: 'Netzwerk',
    icon: '🌐',
    description: 'Switches, Router & Firewall Konfiguration, VPN und Netzwerksicherheit.',
    category: 'network'
  },
  {
    id: 'security',
    title: 'Sicherheit',
    icon: '🔒',
    description: 'Security Guidelines, Penetration Testing und Compliance-Standards.',
    category: 'security'
  },
  {
    id: 'backup',
    title: 'Backup & Recovery',
    icon: '💾',
    description: 'Datensicherung, Disaster Recovery und Business Continuity Planning.',
    category: 'backup'
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: '📊',
    description: 'System- & Netzwerk-Überwachung, Alerting und Performance-Analyse.',
    category: 'monitoring'
  },
  {
    id: 'troubleshoot',
    title: 'Troubleshooting',
    icon: '🔧',
    description: 'Problemlösung, Diagnose-Tools und systematische Fehleranalyse.',
    category: 'troubleshoot'
  }
];

// Icons für Dark Mode Toggle
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

// Topic Card Component
interface TopicCardProps {
  topic: TopicData;
  index: number;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, index }) => (
  <div 
    className={`topic-card topic-card--${topic.category} animate-fade-in-up`}
    style={{ animationDelay: `${index * 100}ms` }}
    tabIndex={0}
    role="button"
    aria-label={`${topic.title} dokumentation öffnen`}
  >
    <div className="topic-card-content">
      <div className="topic-card-icon" role="img" aria-label={topic.title}>
        {topic.icon}
      </div>
      <div>
        <h3 className="topic-card-title">{topic.title}</h3>
        <p className="topic-card-description">{topic.description}</p>
      </div>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h2 className="hero-title">
                Willkommen zur IT-Dokumentation
              </h2>
              <p className="hero-description">
                Zentrale Anlaufstelle für alle technischen Dokumentationen, 
                Anleitungen und Best Practices. Professionell organisiert für 
                maximale Effizienz in der IT-Administration.
              </p>
            </div>
          </div>
        </section>

        {/* Topics Grid */}
        <section className="main-content">
          <div className="topics-grid">
            {topicsData.map((topic, index) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Status Section */}
        <section className="main-content">
          <div className="container">
            <div className="text-center">
              <h3 style={{ marginBottom: 'var(--space-lg)' }}>System Status</h3>
              <div className="flex justify-center gap-md flex-wrap">
                <span className="badge badge--success">Alle Services Online</span>
                <span className="badge badge--info">Wartung geplant: 23:00</span>
                <span className="badge badge--warning">Updates verfügbar</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button 
        className="fab"
        aria-label="Neue Dokumentation hinzufügen"
        title="Neue Dokumentation"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

export default App;