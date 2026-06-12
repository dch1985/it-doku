import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Asset, TrustDocument } from './types'
import { seedAssets, seedDocuments } from './seed'

export function makeId(prefix = 'id') {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}-${rnd.slice(0, 8)}`
}

interface TrustDocState {
  documents: TrustDocument[]
  assets: Asset[]
  createDocument: (
    doc: Omit<TrustDocument, 'id' | 'createdAt' | 'updatedAt'>
  ) => TrustDocument
  updateDocument: (id: string, patch: Partial<TrustDocument>) => void
  deleteDocument: (id: string) => void
  createAsset: (asset: Omit<Asset, 'id'>) => Asset
  updateAsset: (id: string, patch: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  resetDemoData: () => void
}

export const useTrustDocStore = create<TrustDocState>()(
  persist(
    (set, get) => ({
      documents: seedDocuments,
      assets: seedAssets,

      createDocument: (doc) => {
        const ts = new Date().toISOString()
        const newDoc: TrustDocument = {
          ...doc,
          id: makeId('doc'),
          createdAt: ts,
          updatedAt: ts,
        }
        set((s) => ({ documents: [newDoc, ...s.documents] }))
        return newDoc
      },

      updateDocument: (id, patch) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
          ),
        })),

      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      createAsset: (asset) => {
        const newAsset: Asset = { ...asset, id: makeId('as') }
        set((s) => ({ assets: [newAsset, ...s.assets] }))
        return newAsset
      },

      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAsset: (id) => {
        // Unlink any documents pointing at the removed asset.
        const docs = get().documents.map((d) =>
          d.linkedAssetId === id ? { ...d, linkedAssetId: null } : d
        )
        set({ assets: get().assets.filter((a) => a.id !== id), documents: docs })
      },

      resetDemoData: () => set({ documents: seedDocuments, assets: seedAssets }),
    }),
    {
      name: 'trustdoc-store-v1',
    }
  )
)
