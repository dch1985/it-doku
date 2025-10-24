import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Sidebar } from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import GlobalChat from './components/GlobalChat';
import { ChatProvider } from './contexts/GlobalChatContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { logger } from './utils/logger';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Application Error caught by boundary:', error, errorInfo);
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <ErrorBoundary onError={handleError}>
      <DarkModeProvider>
        <ChatProvider>
          <Router>
            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
              {/* Sidebar */}
              <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />

              {/* Main Content */}
              <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
                <div className="min-h-screen">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ErrorBoundary>
                          <Dashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/documents"
                      element={
                        <ErrorBoundary>
                          <DocumentsPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/documents/:id"
                      element={
                        <ErrorBoundary>
                          <DocumentDetailPage />
                        </ErrorBoundary>
                      }
                    />
                    {/* Redirect old routes */}
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </main>

              {/* Global Chat */}
              <GlobalChat />
            </div>

            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              className="mt-16"
            />
          </Router>
        </ChatProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
};

export default App;