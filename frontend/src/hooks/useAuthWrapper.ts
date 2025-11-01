/**
 * Wrapper hook that uses the correct auth provider based on dev mode
 * This allows components to use a single hook instead of checking dev mode
 */
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { DevAuthContext } from '@/contexts/DevAuthContext';

// Common interface for both auth providers
interface AuthWrapperType {
  isAuthenticated: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading?: boolean;
  isLoading?: boolean;
  acquireToken?: () => Promise<string | null>;
}

export function useAuthWrapper(): AuthWrapperType {
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
  
  // Check which context is available
  // useContext returns undefined if the context is not provided
  const msalContext = useContext(AuthContext);
  const devContext = useContext(DevAuthContext);
  
  // Use the context that is actually available
  if (isDevMode && devContext !== undefined) {
    // In dev mode, use DevAuthContext
    return {
      isAuthenticated: devContext.isAuthenticated,
      user: devContext.user,
      login: devContext.login,
      logout: devContext.logout,
      loading: devContext.loading,
      acquireToken: devContext.acquireToken,
    };
  } else if (!isDevMode && msalContext !== undefined) {
    // In production mode, use AuthContext
    return {
      isAuthenticated: msalContext.isAuthenticated,
      user: msalContext.user,
      login: msalContext.login,
      logout: msalContext.logout,
      isLoading: msalContext.isLoading,
    };
  } else if (devContext !== undefined) {
    // Fallback: use DevAuth if available
    return {
      isAuthenticated: devContext.isAuthenticated,
      user: devContext.user,
      login: devContext.login,
      logout: devContext.logout,
      loading: devContext.loading,
      acquireToken: devContext.acquireToken,
    };
  } else if (msalContext !== undefined) {
    // Fallback: use MSAL Auth if available
    return {
      isAuthenticated: msalContext.isAuthenticated,
      user: msalContext.user,
      login: msalContext.login,
      logout: msalContext.logout,
      isLoading: msalContext.isLoading,
    };
  } else {
    // Neither context is available
    throw new Error('No auth provider available. Please ensure AuthProvider or DevAuthProvider is wrapping your app.');
  }
}

