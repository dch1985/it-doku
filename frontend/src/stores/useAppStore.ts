import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AppSettings {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  language: 'de' | 'en';
  notifications: boolean;
}

interface AppState {
  // User State
  user: User | null;
  isAuthenticated: boolean;
  
  // App Settings
  settings: AppSettings;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        settings: {
          theme: 'dark',
          sidebarCollapsed: false,
          language: 'de',
          notifications: true,
        },
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          }),

        updateSettings: (newSettings) =>
          set((state) => {
            state.settings = { ...state.settings, ...newSettings };
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.settings.sidebarCollapsed = !state.settings.sidebarCollapsed;
          }),

        toggleTheme: () =>
          set((state) => {
            state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
          }),

        logout: () =>
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
          }),
      })),
      {
        name: 'app-storage',
        partialize: (state) => ({
          settings: state.settings,
          user: state.user,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
