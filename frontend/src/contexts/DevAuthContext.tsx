import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface DevAuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string; role: string } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  acquireToken: () => Promise<string | null>; // Add acquireToken for compatibility
}

export const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

/**
 * Development Authentication Context
 * Provides mock authentication for testing without Azure AD
 * Only active when VITE_DEV_AUTH_ENABLED=true
 */
export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const appStoreSetUser = useAppStore((state) => state.setUser);
  const appStoreLogout = useAppStore((state) => state.logout);

  // Check if dev mode is enabled
  const isDevMode = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

  useEffect(() => {
    if (!isDevMode) {
      setLoading(false);
      return;
    }

    // Try to load user from localStorage
    const storedUser = localStorage.getItem('dev-auth-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        appStoreSetUser({
          id: parsedUser.id,
          email: parsedUser.email,
          name: parsedUser.name,
          role: parsedUser.role === 'ADMIN' ? 'admin' : 'user',
        });
      } catch (error) {
        console.error('[Dev Auth] Failed to parse stored user:', error);
        localStorage.removeItem('dev-auth-user');
      }
    }
    setLoading(false);
  }, [isDevMode, appStoreSetUser]);

  const login = async () => {
    if (!isDevMode) {
      toast.error('Dev auth not enabled. Please configure Azure AD B2C.');
      return;
    }

    setLoading(true);
    try {
      // VITE_API_URL might already include /api, so we check and construct the URL properly
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      const response = await fetch(`${apiURL}/auth/dev-login`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('dev-auth-user', JSON.stringify(userData));
      appStoreSetUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role === 'ADMIN' ? 'admin' : 'user',
      });
      toast.success(`Welcome, ${userData.name}! (Dev Mode)`);
    } catch (error: any) {
      console.error('[Dev Auth] Login error:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('dev-auth-user');
    appStoreLogout();
    toast.info('Logged out (Dev Mode)');
  };

  const acquireToken = async (): Promise<string | null> => {
    // In dev mode, we don't use tokens - return null
    // The backend will use dev auth middleware
    return null;
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading,
    acquireToken,
  };

  return <DevAuthContext.Provider value={value}>{children}</DevAuthContext.Provider>;
}

export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (context === undefined) {
    throw new Error('useDevAuth must be used within a DevAuthProvider');
  }
  return context;
}

