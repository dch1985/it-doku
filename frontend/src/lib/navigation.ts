export type Page =
  | 'dashboard'
  | 'documents'
  | 'document-detail'
  | 'infrastructure'
  | 'agent'
  | 'settings'

export interface Route {
  page: Page
  documentId?: string
}

export function parseHash(hash: string): Route {
  const value = hash.replace(/^#/, '')
  if (value === 'documents') return { page: 'documents' }
  if (value.startsWith('document/')) return { page: 'document-detail', documentId: value.split('/')[1] }
  if (value === 'infrastructure') return { page: 'infrastructure' }
  if (value === 'agent') return { page: 'agent' }
  if (value === 'settings') return { page: 'settings' }
  return { page: 'dashboard' }
}

export function navigate(hash: string) {
  window.location.hash = hash
}
