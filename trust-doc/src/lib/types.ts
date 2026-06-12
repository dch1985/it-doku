export type DocType =
  | 'server'
  | 'network'
  | 'application'
  | 'storage'
  | 'security'
  | 'backup'

export type DocStatus = 'draft' | 'review' | 'published'
export type Environment = 'production' | 'staging' | 'development'
export type Criticality = 'low' | 'medium' | 'high' | 'critical'

export interface DocSection {
  heading: string
  body: string
}

export interface DocEntry {
  id: string
  title: string
  type: DocType
  status: DocStatus
  environment: Environment
  criticality: Criticality
  owner: string
  tags: string[]
  /** Type-specific structured key/value facts. */
  fields: Record<string, string>
  /** Free-form documentation sections (markdown-ish plain text). */
  sections: DocSection[]
  createdAt: string
  updatedAt: string
  /** Marks docs produced by an agent skill. */
  generatedBy?: string
}

export interface DocTypeMeta {
  type: DocType
  label: string
  description: string
  /** Fields the documentation standard requires for this type. */
  requiredFields: string[]
  /** Sections the documentation standard requires for this type. */
  requiredSections: string[]
}
