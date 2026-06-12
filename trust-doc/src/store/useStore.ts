import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocEntry } from '@/lib/types'
import { SEED_DOCS } from '@/data/seed'

export type Theme = 'light' | 'dark' | 'system'
export type Page = 'dashboard' | 'documentation' | 'agents' | 'settings'

interface Settings {
  orgName: string
  standard: string
}

interface AppState {
  docs: DocEntry[]
  theme: Theme
  settings: Settings
  addDoc: (doc: DocEntry) => void
  updateDoc: (id: string, patch: Partial<DocEntry>) => void
  deleteDoc: (id: string) => void
  setTheme: (theme: Theme) => void
  setSettings: (patch: Partial<Settings>) => void
  resetData: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      docs: SEED_DOCS,
      theme: 'system',
      settings: { orgName: 'Acme IT', standard: 'ISO 27001' },
      addDoc: (doc) => set((s) => ({ docs: [doc, ...s.docs] })),
      updateDoc: (id, patch) =>
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
          ),
        })),
      deleteDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
      setTheme: (theme) => set({ theme }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetData: () => set({ docs: SEED_DOCS }),
    }),
    {
      name: 'trust-doc-store',
      version: 1,
    },
  ),
)
