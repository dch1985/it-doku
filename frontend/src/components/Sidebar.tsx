import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Menu,
  X,
  BookOpen,
  ChevronLeft,
  Moon,
  Sun
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Übersicht & Statistiken' },
    { path: '/documents', icon: FileText, label: 'Dokumente', description: 'Alle Dokumentationen' },
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
          bg-white/80 dark:bg-gray-900/95
          backdrop-blur-xl border-r border-gray-200 dark:border-gray-800
          shadow-xl
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center lg:w-full'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-white font-bold text-lg leading-tight">
                  IT-Doku
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Dokumentations-System
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                  ${
                    active
                      ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-blue-600 dark:text-blue-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${!isOpen && 'lg:justify-center lg:px-2'}
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-r-full" />
                )}

                <Icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />

                {isOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {active && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}

                {!isOpen && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-800" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl w-full
              text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200 group relative
              ${!isOpen && 'lg:justify-center lg:px-2'}
            `}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isOpen && <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}

            {!isOpen && (
              <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-800" />
              </div>
            )}
          </button>

          {/* Settings */}
          <Link
            to="/settings"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl
              text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200 group relative
              ${!isOpen && 'lg:justify-center lg:px-2'}
            `}
          >
            <Settings className="w-5 h-5" />
            {isOpen && <span className="font-medium">Einstellungen</span>}

            {!isOpen && (
              <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Einstellungen
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-800" />
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Desktop Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          hidden lg:block fixed top-4 z-40
          p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
          text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
          rounded-lg shadow-lg hover:shadow-xl
          transition-all duration-300
          ${isOpen ? 'left-60' : 'left-16'}
        `}
      >
        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
      </button>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
}