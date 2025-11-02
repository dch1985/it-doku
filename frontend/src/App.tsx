import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { DevAuthProvider } from './contexts/DevAuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingPage } from './router/lazyRoutes'
import { PortalApp } from './PortalApp'
import { useAuthWrapper } from './hooks/useAuthWrapper'

function App() {
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
  const AuthWrapper = isDevMode ? DevAuthProvider : AuthProvider;

  return (
    <ErrorBoundary>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuthWrapper();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <QueryProvider>
      <ChatProvider>
        <PortalApp />
      </ChatProvider>
    </QueryProvider>
  );
}

export default App