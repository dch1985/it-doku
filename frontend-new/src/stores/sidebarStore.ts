import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  isOpen: boolean
  isChatOpen: boolean
  toggle: () => void
  toggleChat: () => void
  open: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      isChatOpen: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
)
