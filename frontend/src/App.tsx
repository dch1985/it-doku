import { AuthProvider } from './contexts/AuthContext'
import { DevAuthProvider } from './contexts/DevAuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingPage } from './pages/LandingPage'
import { Portal } from './trustdoc/Portal'
import { useAuthWrapper } from './hooks/useAuthWrapper'

function App() {
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
  const AuthWrapper = isDevMode ? DevAuthProvider : AuthProvider

  return (
    <ErrorBoundary>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuthWrapper()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return <Portal />
}

export default App
