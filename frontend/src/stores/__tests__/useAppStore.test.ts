import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/stores/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
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
    })
  })

  describe('Theme Management', () => {
    it('should toggle theme from dark to light', () => {
      const { toggleTheme } = useAppStore.getState()
      
      expect(useAppStore.getState().settings.theme).toBe('dark')
      
      toggleTheme()
      
      expect(useAppStore.getState().settings.theme).toBe('light')
    })

    it('should toggle theme from light to dark', () => {
      const { toggleTheme, updateSettings } = useAppStore.getState()
      
      updateSettings({ theme: 'light' })
      expect(useAppStore.getState().settings.theme).toBe('light')
      
      toggleTheme()
      
      expect(useAppStore.getState().settings.theme).toBe('dark')
    })
  })

  describe('Sidebar Management', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      const { toggleSidebar } = useAppStore.getState()
      
      expect(useAppStore.getState().settings.sidebarCollapsed).toBe(false)
      
      toggleSidebar()
      
      expect(useAppStore.getState().settings.sidebarCollapsed).toBe(true)
    })

    it('should toggle sidebar back and forth', () => {
      const { toggleSidebar } = useAppStore.getState()
      
      toggleSidebar()
      expect(useAppStore.getState().settings.sidebarCollapsed).toBe(true)
      
      toggleSidebar()
      expect(useAppStore.getState().settings.sidebarCollapsed).toBe(false)
    })
  })

  describe('User Authentication', () => {
    it('should set user and mark as authenticated', () => {
      const { setUser } = useAppStore.getState()
      
      const testUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
      }
      
      setUser(testUser)
      
      expect(useAppStore.getState().user).toEqual(testUser)
      expect(useAppStore.getState().isAuthenticated).toBe(true)
    })

    it('should logout and clear user', () => {
      const { setUser, logout } = useAppStore.getState()
      
      // Login first
      setUser({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      })
      
      expect(useAppStore.getState().isAuthenticated).toBe(true)
      
      // Logout
      logout()
      
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('Loading and Error State', () => {
    it('should set loading state', () => {
      const { setLoading } = useAppStore.getState()
      
      setLoading(true)
      expect(useAppStore.getState().isLoading).toBe(true)
      
      setLoading(false)
      expect(useAppStore.getState().isLoading).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = useAppStore.getState()
      
      const errorMessage = 'Test error'
      setError(errorMessage)
      
      expect(useAppStore.getState().error).toBe(errorMessage)
      
      setError(null)
      expect(useAppStore.getState().error).toBeNull()
    })
  })

  describe('Settings Update', () => {
    it('should update multiple settings at once', () => {
      const { updateSettings } = useAppStore.getState()
      
      updateSettings({
        language: 'en',
        notifications: false,
      })
      
      const settings = useAppStore.getState().settings
      expect(settings.language).toBe('en')
      expect(settings.notifications).toBe(false)
      expect(settings.theme).toBe('dark') // unchanged
    })
  })
})
