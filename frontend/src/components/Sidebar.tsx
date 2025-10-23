import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
    FileCode,
  Settings, 
  Menu,
  X,
  Sparkles,
  FolderOpen,
  Database
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();

  const navItems = [
  { path: '/', icon: Home, label: 'Dashboard', badge: null },
  { path: '/documents', icon: FileText, label: 'Dokumente', badge: null },
  { path: '/analyze', icon: FileCode, label: 'Code Analyse', badge: 'AI' },
  { path: '/poc', icon: FolderOpen, label: 'POC', badge: null },
];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
          border-r border-gray-800/50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center lg:w-full'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight">IT-Doku</span>
                <span className="text-gray-400 text-xs">AI Assistant</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 group relative
                  ${active 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-cyan-400 shadow-lg shadow-cyan-500/5' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }
                  ${!isOpen && 'lg:justify-center lg:px-2'}
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-r-full" />
                )}
                
                <Icon className="w-5 h-5" />
                
                {isOpen && <span className="font-medium flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50">
          <Link
            to="/settings"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl
              text-gray-400 hover:text-white hover:bg-gray-800/50
              transition-all duration-200
              ${!isOpen && 'lg:justify-center lg:px-2'}
            `}
          >
            <Settings className="w-5 h-5" />
            {isOpen && <span className="font-medium">Einstellungen</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-gray-900 text-white rounded-xl shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
}