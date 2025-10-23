import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import DocumentsPage from './pages/DocumentsPage';
import DashboardPage from './pages/DashboardPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import GlobalChat from './components/GlobalChat';
import { ChatProvider } from './contexts/GlobalChatContext';
import { logger } from './utils/logger';
import POC from './pages/POC';
import CodeAnalysisPage from './pages/CodeAnalysisPage';
import ApiTest from './pages/ApiTest';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Application Error caught by boundary:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ChatProvider>
        <Router>
          <div className="flex min-h-screen bg-gray-950">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            
            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
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
                  path="/home" 
                  element={
                    <ErrorBoundary>
                      <HomePage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ErrorBoundary>
                      <DashboardPage />
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
                <Route 
                  path="/analyze" 
                  element={
                    <ErrorBoundary>
                      <CodeAnalysisPage />
                    </ErrorBoundary>
                  } 
                />
                <Route path="/test" element={<ApiTest />} />
                <Route path="/poc" element={<POC />} />
              </Routes>
            </main>
            
            {/* Global Chat */}
            <GlobalChat />
          </div>
        </Router>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default App;