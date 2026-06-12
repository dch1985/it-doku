export const DOCUMENT_CATEGORIES = [
  'SERVER',
  'NETWORK',
  'SECURITY',
  'BACKUP',
  'MONITORING',
  'RUNBOOK',
  'GENERAL',
] as const
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export const DOCUMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'NEEDS_REVIEW', 'ARCHIVED'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const ASSET_TYPES = [
  'SERVER',
  'VM',
  'DATABASE',
  'SWITCH',
  'ROUTER',
  'FIREWALL',
  'STORAGE',
  'APPLICATION',
  'CLOUD_SERVICE',
] as const
export type AssetType = (typeof ASSET_TYPES)[number]

export const CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Criticality = (typeof CRITICALITIES)[number]

export interface AssetRef {
  id: string
  name: string
  type: string
}

export interface Document {
  id: string
  title: string
  content: string
  category: DocumentCategory
  status: DocumentStatus
  tags: string[]
  version: number
  generatedBy: string | null
  reviewedAt: string | null
  assetId: string | null
  asset: AssetRef | null
  createdAt: string
  updatedAt: string
}

export interface DocumentRef {
  id: string
  title: string
  category: string
  status: string
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  hostname: string | null
  ipAddress: string | null
  os: string | null
  location: string | null
  owner: string | null
  criticality: Criticality
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED'
  notes: string | null
  documents: DocumentRef[]
  createdAt: string
  updatedAt: string
}

export interface SkillInput {
  key: string
  label: string
  type: 'boolean' | 'assetId'
  default?: boolean
}

export interface Skill {
  id: string
  name: string
  description: string
  writes: string
  inputs: SkillInput[]
}

export type Severity = 'info' | 'warning' | 'critical'

export interface AgentRun {
  id: string
  skillId: string
  skillName: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  summary: string | null
  input: Record<string, unknown>
  steps: { label: string; detail: string }[]
  findings: { severity: Severity; title: string; detail: string; documentId?: string; assetId?: string }[]
  actions: { type: string; label: string; documentId?: string }[]
  durationMs: number | null
  createdAt: string
  finishedAt: string | null
}

export interface Stats {
  documents: {
    total: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    stale: number
  }
  assets: { total: number }
  coverage: { required: number; covered: number; percent: number }
  lastAgentRun: AgentRun | null
}
