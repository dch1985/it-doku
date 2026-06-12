import { QueryProvider } from './providers/QueryProvider'
import { AuthProvider } from './contexts/AuthContext'
import { DevAuthProvider } from './contexts/DevAuthContext'
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl trust-gradient animate-pulse" />
          <p className="text-muted-foreground">Loading Trust Doc...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <QueryProvider>
      <PortalApp />
    </QueryProvider>
  );
}

export default App
