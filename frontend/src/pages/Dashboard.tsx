import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Database,
  TrendingUp
} from 'lucide-react';
import { documentService } from '../services/document.service';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentDocuments: 0,
    aiGenerations: 0,
    lastUpdated: new Date(),
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await documentService.getAll();
      setStats({
        totalDocuments: response.total || response.documents.length,
        recentDocuments: response.documents.filter(d => {
          const created = new Date(d.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        aiGenerations: 0,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const statCards = [
    {
      label: 'Gesamt Dokumente',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'from-cyan-500 to-blue-600',
      change: '+12%',
    },
    {
      label: 'Diese Woche',
      value: stats.recentDocuments,
      icon: Clock,
      color: 'from-purple-500 to-pink-600',
      change: '+3',
    },
    {
      label: 'AI Generierungen',
      value: stats.aiGenerations,
      icon: Sparkles,
      color: 'from-orange-500 to-red-600',
      change: 'Neu',
    },
    {
      label: 'Aktive Projekte',
      value: 4,
      icon: Database,
      color: 'from-green-500 to-emerald-600',
      change: '+1',
    },
  ];

  const quickActions = [
    {
      title: 'Neues Dokument',
      description: 'Erstelle eine neue Dokumentation',
      icon: FileText,
      link: '/documents',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'AI-Assistent',
      description: 'Lass die KI dir helfen',
      icon: Sparkles,
      link: '#',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Code Analyse',
      description: 'Analysiere deinen Code',
      icon: Zap,
      link: '#',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </span>
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
          </h1>
          <p className="text-gray-400">
            Willkommen zurück! Hier ist deine Übersicht.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                  
                  <div className="relative p-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {action.description}
                    </p>
                    
                    <div className="flex items-center text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Starten
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              Letzte Aktivität
            </h2>
            <Link
              to="/documents"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1"
            >
              Alle anzeigen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Dokument bearbeitet</div>
                  <div className="text-sm text-gray-400">Vor {i} Stunden</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;