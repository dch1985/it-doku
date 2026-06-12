import type { AgentRun, Asset, Document, Skill, Stats } from './types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const API = BASE.endsWith('/api') ? BASE : `${BASE}/api`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {
      // keep default message
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  stats: () => request<Stats>('/stats'),

  documents: {
    list: (params?: { category?: string; status?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.category) search.set('category', params.category)
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return request<Document[]>(`/documents${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Document>(`/documents/${id}`),
    create: (data: Partial<Document>) =>
      request<Document>('/documents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Document>) =>
      request<Document>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    review: (id: string) => request<Document>(`/documents/${id}/review`, { method: 'POST' }),
    remove: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
  },

  assets: {
    list: (params?: { type?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.type) search.set('type', params.type)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return request<Asset[]>(`/assets${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Asset>(`/assets/${id}`),
    create: (data: Partial<Asset>) =>
      request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Asset>) =>
      request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/assets/${id}`, { method: 'DELETE' }),
  },

  agent: {
    skills: () => request<Skill[]>('/agent/skills'),
    run: (skillId: string, input: Record<string, unknown>) =>
      request<AgentRun>(`/agent/skills/${skillId}/run`, { method: 'POST', body: JSON.stringify(input) }),
    runs: () => request<AgentRun[]>('/agent/runs'),
  },
}
