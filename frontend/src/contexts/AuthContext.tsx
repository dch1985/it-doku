import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  useMsal,
  useIsAuthenticated,
  useAccount,
} from '@azure/msal-react';
import { InteractionStatus, AccountInfo } from '@azure/msal-browser';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] || {});
  const { setUser, logout: logoutStore } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);

  // Fetch user info from backend when authenticated
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isMsalAuthenticated && account) {
        try {
          // Get access token
          const response = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: account,
          });

          // Fetch user info from backend
          const backendResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });

          if (backendResponse.ok) {
            const userData = await backendResponse.json();
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role === 'ADMIN' ? 'admin' : 'user',
            });
          }
        } catch (error) {
          console.error('[Auth] Error fetching user info:', error);
          toast.error('Failed to fetch user information');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (inProgress === InteractionStatus.None) {
      fetchUserInfo();
    }
  }, [isMsalAuthenticated, account, instance, inProgress, setUser]);

  const login = async () => {
    try {
      setIsLoading(true);
      await instance.loginPopup({
        scopes: ['User.Read'],
      });
      toast.success('Successfully logged in');
    } catch (error) {
      console.error('[Auth] Login error:', error);
      toast.error('Failed to login');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      logoutStore();
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      toast.error('Failed to logout');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isMsalAuthenticated,
        isLoading: isLoading || inProgress !== InteractionStatus.None,
        user: account || null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

