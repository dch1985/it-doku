export type DocCategory =
  | 'Server'
  | 'Network'
  | 'Security'
  | 'Backup & DR'
  | 'Infrastructure'
  | 'Runbook'
  | 'Application'

export const DOC_CATEGORIES: DocCategory[] = [
  'Server',
  'Network',
  'Security',
  'Backup & DR',
  'Infrastructure',
  'Runbook',
  'Application',
]

export type DocStatus = 'Draft' | 'In Review' | 'Published' | 'Outdated'

export const DOC_STATUSES: DocStatus[] = ['Draft', 'In Review', 'Published', 'Outdated']

export interface TrustDocument {
  id: string
  title: string
  category: DocCategory
  status: DocStatus
  content: string
  tags: string[]
  owner: string
  linkedAssetId?: string | null
  createdAt: string
  updatedAt: string
  generatedByAgent?: boolean
  skillId?: string
}

export type AssetType =
  | 'Physical Server'
  | 'Virtual Machine'
  | 'Hypervisor'
  | 'Firewall'
  | 'Switch'
  | 'Router'
  | 'Storage'
  | 'Load Balancer'

export const ASSET_TYPES: AssetType[] = [
  'Physical Server',
  'Virtual Machine',
  'Hypervisor',
  'Firewall',
  'Switch',
  'Router',
  'Storage',
  'Load Balancer',
]

export type Environment = 'Production' | 'Staging' | 'Development' | 'DR'

export const ENVIRONMENTS: Environment[] = ['Production', 'Staging', 'Development', 'DR']

export type AssetStatus = 'Operational' | 'Degraded' | 'Maintenance' | 'Offline'

export const ASSET_STATUSES: AssetStatus[] = ['Operational', 'Degraded', 'Maintenance', 'Offline']

export interface Asset {
  id: string
  name: string
  type: AssetType
  environment: Environment
  status: AssetStatus
  ip: string
  os?: string
  location: string
  owner: string
  notes?: string
}
