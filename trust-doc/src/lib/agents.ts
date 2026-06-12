import {
  Server,
  Network,
  ClipboardCheck,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Criticality, DocEntry, DocType, Environment } from './types'
import { DOC_TYPE_META, fieldLabel } from './standards'
import { daysSince, uid } from './utils'

/* ------------------------------------------------------------------ */
/* Completeness scoring                                                 */
/* ------------------------------------------------------------------ */

export interface Completeness {
  score: number
  missingFields: string[]
  missingSections: string[]
}

const PLACEHOLDER = /to be completed|tbd|unknown|n\/a|^—$/i

function sectionFilled(body: string): boolean {
  const trimmed = body.trim()
  return trimmed.length >= 24 && !PLACEHOLDER.test(trimmed)
}

export function completeness(doc: DocEntry): Completeness {
  const meta = DOC_TYPE_META[doc.type]
  const missingFields = meta.requiredFields.filter((f) => {
    const v = doc.fields[f]
    return !v || !v.trim() || PLACEHOLDER.test(v.trim())
  })
  const sectionMap = new Map(doc.sections.map((s) => [s.heading.toLowerCase(), s.body]))
  const missingSections = meta.requiredSections.filter((h) => {
    const body = sectionMap.get(h.toLowerCase())
    return body === undefined || !sectionFilled(body)
  })
  const total = meta.requiredFields.length + meta.requiredSections.length
  const present = total - missingFields.length - missingSections.length
  return {
    score: total === 0 ? 100 : Math.round((present / total) * 100),
    missingFields,
    missingSections,
  }
}

/* ------------------------------------------------------------------ */
/* Result types                                                        */
/* ------------------------------------------------------------------ */

export type Severity = 'critical' | 'warning' | 'info' | 'ok'

export interface Finding {
  severity: Severity
  title: string
  detail: string
  docId?: string
  docTitle?: string
}

export interface ControlGroup {
  title: string
  reference: string
  coverage: number
  items: { label: string; ok: boolean; note: string }[]
}

export interface AnalyzerReport {
  kind: 'analyzer'
  agentId: string
  agentName: string
  generatedAt: string
  score: number
  scoreLabel: string
  summary: string
  stats: { label: string; value: string }[]
  findings: Finding[]
  groups?: ControlGroup[]
}

export interface BuilderResult {
  kind: 'builder'
  agentId: string
  agentName: string
  generatedAt: string
  doc: DocEntry
  completeness: Completeness
  notes: string[]
}

export type AgentResult = AnalyzerReport | BuilderResult

/* ------------------------------------------------------------------ */
/* Agent definitions                                                   */
/* ------------------------------------------------------------------ */

export interface AgentInput {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  half?: boolean
}

export interface Agent {
  id: string
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  accent: string
  kind: 'builder' | 'analyzer'
  category: string
  skills: string[]
  steps: string[]
  inputs?: AgentInput[]
  buildType?: DocType
}

const ENV_OPTIONS = ['production', 'staging', 'development']
const CRIT_OPTIONS = ['low', 'medium', 'high', 'critical']

export const AGENTS: Agent[] = [
  {
    id: 'server-builder',
    name: 'Server Documentation Builder',
    tagline: 'Generates a complete, standardized server document from a handful of facts.',
    description:
      'A deterministic expert that assembles a full server documentation record — overview, hardware, network, services, access, backup, monitoring, dependencies and maintenance — following the Trust Doc server standard. Anything you leave blank is flagged for completion, never invented.',
    icon: Server,
    accent: 'from-indigo-500 to-blue-500',
    kind: 'builder',
    category: 'Authoring',
    buildType: 'server',
    skills: [
      'Builds all 9 required server sections automatically',
      'Applies datacenter & role naming conventions',
      'Flags every missing fact instead of guessing',
      'Pre-fills backup, monitoring and access checklists',
    ],
    steps: [
      'Parsing input facts',
      'Selecting server standard template',
      'Composing structured sections',
      'Validating required fields',
      'Finalizing document',
    ],
    inputs: [
      { key: 'hostname', label: 'Hostname', placeholder: 'e.g. DC-APP-01', required: true, half: true },
      { key: 'ipAddress', label: 'IP Address', placeholder: 'e.g. 10.20.1.14', half: true },
      { key: 'role', label: 'Server Role', placeholder: 'e.g. Application server (IIS)', required: true },
      { key: 'os', label: 'Operating System', placeholder: 'e.g. Windows Server 2022', half: true },
      { key: 'location', label: 'Location / Datacenter', placeholder: 'e.g. DC Frankfurt — Rack B3', half: true },
      { key: 'cpu', label: 'CPU', placeholder: 'e.g. 8 vCPU', half: true },
      { key: 'memory', label: 'Memory (RAM)', placeholder: 'e.g. 32 GB', half: true },
      { key: 'storage', label: 'Storage', placeholder: 'e.g. 2 × 480 GB SSD (RAID1)', half: true },
      { key: 'owner', label: 'Owner / Team', placeholder: 'e.g. Platform Team', half: true },
      { key: 'environment', label: 'Environment', type: 'select', options: ENV_OPTIONS, half: true },
      { key: 'criticality', label: 'Criticality', type: 'select', options: CRIT_OPTIONS, half: true },
    ],
  },
  {
    id: 'network-builder',
    name: 'Network Device Documenter',
    tagline: 'Produces firewall, switch and router documentation in seconds.',
    description:
      'Captures management access, interfaces, routing, firewall posture and configuration backup for any network device using the Trust Doc network standard. Ideal for firewalls, core switches and routers.',
    icon: Network,
    accent: 'from-cyan-500 to-teal-500',
    kind: 'builder',
    category: 'Authoring',
    buildType: 'network',
    skills: [
      'Documents interfaces, VLANs and routing posture',
      'Captures management and break-glass access',
      'Records configuration backup procedure',
      'Highlights missing firmware / monitoring data',
    ],
    steps: [
      'Parsing device facts',
      'Selecting network standard template',
      'Mapping interfaces & access',
      'Validating required fields',
      'Finalizing document',
    ],
    inputs: [
      { key: 'hostname', label: 'Device Name', placeholder: 'e.g. FW-EDGE-01', required: true, half: true },
      { key: 'mgmtIp', label: 'Management IP', placeholder: 'e.g. 10.0.0.1', half: true },
      { key: 'deviceRole', label: 'Device Role', placeholder: 'e.g. Perimeter firewall', required: true },
      { key: 'vendor', label: 'Vendor', placeholder: 'e.g. Fortinet', half: true },
      { key: 'model', label: 'Model', placeholder: 'e.g. FortiGate 100F', half: true },
      { key: 'firmware', label: 'Firmware', placeholder: 'e.g. FortiOS 7.4.3', half: true },
      { key: 'location', label: 'Location', placeholder: 'e.g. DC Frankfurt — Rack A1', half: true },
      { key: 'owner', label: 'Owner / Team', placeholder: 'e.g. Network Team', half: true },
      { key: 'environment', label: 'Environment', type: 'select', options: ENV_OPTIONS, half: true },
      { key: 'criticality', label: 'Criticality', type: 'select', options: CRIT_OPTIONS, half: true },
    ],
  },
  {
    id: 'auditor',
    name: 'Documentation Auditor',
    tagline: 'Scans every document for missing fields and sections.',
    description:
      'Walks the entire library, scores each record against its Trust Doc standard and reports concrete gaps — missing fields, empty required sections and incomplete records — with an overall coverage score.',
    icon: ClipboardCheck,
    accent: 'from-violet-500 to-fuchsia-500',
    kind: 'analyzer',
    category: 'Quality',
    skills: [
      'Scores completeness per document',
      'Lists every missing field and section',
      'Computes overall documentation coverage',
      'Prioritizes critical-system gaps first',
    ],
    steps: [
      'Loading documentation library',
      'Scoring each record against its standard',
      'Detecting missing fields & sections',
      'Ranking findings by severity',
      'Compiling coverage report',
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Mapper',
    tagline: 'Maps your documentation to ISO 27001 / NIST control families.',
    description:
      'Evaluates whether your documentation provides evidence for key control families (asset management, access control, operations, backup & recovery, policies) and reports covered controls versus gaps.',
    icon: ShieldCheck,
    accent: 'from-emerald-500 to-green-500',
    kind: 'analyzer',
    category: 'Compliance',
    skills: [
      'Maps documents to ISO 27001 / NIST controls',
      'Checks asset inventory completeness',
      'Verifies backup & recovery evidence (RPO/RTO)',
      'Surfaces missing policies and access records',
    ],
    steps: [
      'Loading control catalogue',
      'Indexing documentation evidence',
      'Mapping evidence to control families',
      'Calculating control coverage',
      'Compiling compliance report',
    ],
  },
  {
    id: 'hygiene',
    name: 'Documentation Hygiene Agent',
    tagline: 'Catches stale, ownerless and inconsistent records.',
    description:
      'Enforces operational hygiene: detects stale documents, missing owners, drafts running in production, duplicate hostnames/IPs and untagged records so your documentation stays trustworthy.',
    icon: ScrollText,
    accent: 'from-amber-500 to-orange-500',
    kind: 'analyzer',
    category: 'Quality',
    skills: [
      'Flags documents not reviewed in 180+ days',
      'Detects drafts on production systems',
      'Finds duplicate hostnames / IP addresses',
      'Reports missing owners and tags',
    ],
    steps: [
      'Loading documentation library',
      'Checking review freshness',
      'Cross-checking identifiers',
      'Validating ownership & metadata',
      'Compiling hygiene report',
    ],
  },
]

export function getAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id)
}

/* ------------------------------------------------------------------ */
/* Builder skills                                                       */
/* ------------------------------------------------------------------ */

function val(input: Record<string, string>, key: string): string {
  const v = input[key]?.trim()
  return v && v.length ? v : ''
}

function orTBD(v: string): string {
  return v || '⚠ To be completed'
}

function buildServerDoc(input: Record<string, string>): { doc: DocEntry; notes: string[] } {
  const now = new Date().toISOString()
  const hostname = val(input, 'hostname') || 'NEW-SERVER'
  const ip = val(input, 'ipAddress')
  const os = val(input, 'os')
  const role = val(input, 'role')
  const location = val(input, 'location')
  const cpu = val(input, 'cpu')
  const memory = val(input, 'memory')
  const storage = val(input, 'storage')
  const owner = val(input, 'owner') || 'Unassigned'
  const env = (val(input, 'environment') || 'production') as Environment
  const crit = (val(input, 'criticality') || 'medium') as Criticality

  const fields: Record<string, string> = {
    hostname,
    ipAddress: orTBD(ip),
    os: orTBD(os),
    role: orTBD(role),
    location: orTBD(location),
    cpu: orTBD(cpu),
    memory: orTBD(memory),
    storage: orTBD(storage),
  }

  const sections = [
    {
      heading: 'Overview',
      body: `${hostname} is a ${role || 'server'} operating in the ${env} environment with ${crit} business criticality. This record documents its configuration, dependencies and operational procedures and is owned by ${owner}.`,
    },
    {
      heading: 'Hardware & OS',
      body: `Operating system: ${orTBD(os)}.\nCompute: ${orTBD(cpu)}, ${orTBD(memory)} memory.\nStorage: ${orTBD(storage)}.\nPhysical/virtual location: ${orTBD(location)}.`,
    },
    {
      heading: 'Network',
      body: `Primary IP address: ${orTBD(ip)}.\nDNS / hostname: ${hostname}.\nFirewall rules, VLAN assignment and load-balancer membership: ⚠ To be completed.`,
    },
    {
      heading: 'Services & Roles',
      body: `Primary role: ${orTBD(role)}.\nInstalled services, ports and scheduled tasks: ⚠ To be completed.`,
    },
    {
      heading: 'Access & Accounts',
      body: `Administrative access is granted to ${owner}. Document privileged accounts, RDP/SSH access method, MFA enforcement and break-glass procedure: ⚠ To be completed.`,
    },
    {
      heading: 'Backup',
      body: `Backup job, schedule, retention and last successful restore test: ⚠ To be completed. Link the relevant Trust Doc backup record once available.`,
    },
    {
      heading: 'Monitoring',
      body: `Monitoring tool, alert thresholds, on-call routing and dashboards: ⚠ To be completed.`,
    },
    {
      heading: 'Dependencies',
      body: `Upstream/downstream dependencies (databases, storage, authentication, applications): ⚠ To be completed.`,
    },
    {
      heading: 'Maintenance',
      body: `Patch window, change-management process and maintenance owner: ⚠ To be completed.`,
    },
  ]

  const notes: string[] = []
  for (const [k, v] of Object.entries(fields)) {
    if (v.startsWith('⚠')) notes.push(`Field "${fieldLabel(k)}" left blank — flagged for completion.`)
  }

  const doc: DocEntry = {
    id: uid('doc'),
    title: hostname,
    type: 'server',
    status: 'draft',
    environment: env,
    criticality: crit,
    owner,
    tags: ['server', env, role].filter(Boolean).map((t) => t.toLowerCase().split(' ')[0]),
    fields,
    sections,
    createdAt: now,
    updatedAt: now,
    generatedBy: 'Server Documentation Builder',
  }
  return { doc, notes }
}

function buildNetworkDoc(input: Record<string, string>): { doc: DocEntry; notes: string[] } {
  const now = new Date().toISOString()
  const hostname = val(input, 'hostname') || 'NEW-DEVICE'
  const mgmtIp = val(input, 'mgmtIp')
  const role = val(input, 'deviceRole')
  const vendor = val(input, 'vendor')
  const model = val(input, 'model')
  const firmware = val(input, 'firmware')
  const location = val(input, 'location')
  const owner = val(input, 'owner') || 'Unassigned'
  const env = (val(input, 'environment') || 'production') as Environment
  const crit = (val(input, 'criticality') || 'high') as Criticality

  const fields: Record<string, string> = {
    hostname,
    mgmtIp: orTBD(mgmtIp),
    vendor: orTBD(vendor),
    model: orTBD(model),
    deviceRole: orTBD(role),
    location: orTBD(location),
    firmware: orTBD(firmware),
  }

  const sections = [
    {
      heading: 'Overview',
      body: `${hostname} is a ${role || 'network device'} (${orTBD(vendor)} ${orTBD(model)}) in the ${env} environment with ${crit} criticality. Managed by ${owner}.`,
    },
    {
      heading: 'Interfaces & VLANs',
      body: `Document physical/logical interfaces, VLAN assignments, trunk ports and IP addressing: ⚠ To be completed.`,
    },
    {
      heading: 'Routing & Firewall',
      body: `Routing protocols, static routes, NAT and firewall policy summary: ⚠ To be completed.`,
    },
    {
      heading: 'Access & Accounts',
      body: `Management IP: ${orTBD(mgmtIp)}. Document admin accounts, access method (HTTPS/SSH), MFA and break-glass: ⚠ To be completed.`,
    },
    {
      heading: 'Configuration Backup',
      body: `Configuration backup method, location, frequency and last verified restore: ⚠ To be completed.`,
    },
    {
      heading: 'Monitoring',
      body: `SNMP/syslog targets, alert thresholds and dashboards: ⚠ To be completed. Firmware: ${orTBD(firmware)}.`,
    },
    {
      heading: 'Dependencies',
      body: `Upstream ISP/links, dependent segments and services: ⚠ To be completed.`,
    },
  ]

  const notes: string[] = []
  for (const [k, v] of Object.entries(fields)) {
    if (v.startsWith('⚠')) notes.push(`Field "${fieldLabel(k)}" left blank — flagged for completion.`)
  }

  const doc: DocEntry = {
    id: uid('doc'),
    title: hostname,
    type: 'network',
    status: 'draft',
    environment: env,
    criticality: crit,
    owner,
    tags: ['network', env, vendor].filter(Boolean).map((t) => t.toLowerCase().split(' ')[0]),
    fields,
    sections,
    createdAt: now,
    updatedAt: now,
    generatedBy: 'Network Device Documenter',
  }
  return { doc, notes }
}

export function runBuilder(agent: Agent, input: Record<string, string>): BuilderResult {
  const { doc, notes } =
    agent.buildType === 'network' ? buildNetworkDoc(input) : buildServerDoc(input)
  return {
    kind: 'builder',
    agentId: agent.id,
    agentName: agent.name,
    generatedAt: new Date().toISOString(),
    doc,
    completeness: completeness(doc),
    notes,
  }
}

/* ------------------------------------------------------------------ */
/* Analyzer skills                                                      */
/* ------------------------------------------------------------------ */

const CRIT_RANK: Record<Criticality, number> = { critical: 3, high: 2, medium: 1, low: 0 }

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Needs work'
  return 'At risk'
}

function runAuditor(docs: DocEntry[]): AnalyzerReport {
  const now = new Date().toISOString()
  const findings: Finding[] = []
  let totalScore = 0
  let fullyDocumented = 0

  const ranked = [...docs].sort((a, b) => CRIT_RANK[b.criticality] - CRIT_RANK[a.criticality])
  for (const doc of ranked) {
    const c = completeness(doc)
    totalScore += c.score
    if (c.score === 100) {
      fullyDocumented++
      continue
    }
    const gaps: string[] = []
    if (c.missingFields.length) gaps.push(`${c.missingFields.length} field(s): ${c.missingFields.map(fieldLabel).join(', ')}`)
    if (c.missingSections.length) gaps.push(`${c.missingSections.length} section(s): ${c.missingSections.join(', ')}`)
    findings.push({
      severity: c.score < 50 ? 'critical' : 'warning',
      title: `${doc.title} is ${c.score}% complete`,
      detail: `Missing ${gaps.join(' · ')}.`,
      docId: doc.id,
      docTitle: doc.title,
    })
  }

  const avg = docs.length ? Math.round(totalScore / docs.length) : 100
  if (!findings.length && docs.length) {
    findings.push({ severity: 'ok', title: 'All documents meet the standard', detail: 'Every record passed completeness validation.' })
  }

  return {
    kind: 'analyzer',
    agentId: 'auditor',
    agentName: 'Documentation Auditor',
    generatedAt: now,
    score: avg,
    scoreLabel: scoreLabel(avg),
    summary: `Audited ${docs.length} document(s). Average completeness ${avg}% with ${findings.filter((f) => f.severity !== 'ok').length} gap(s) found.`,
    stats: [
      { label: 'Documents audited', value: String(docs.length) },
      { label: 'Fully documented', value: String(fullyDocumented) },
      { label: 'Avg. completeness', value: `${avg}%` },
      { label: 'Open gaps', value: String(findings.filter((f) => f.severity !== 'ok').length) },
    ],
    findings,
  }
}

function hasSectionFilled(doc: DocEntry, heading: string): boolean {
  const s = doc.sections.find((x) => x.heading.toLowerCase() === heading.toLowerCase())
  return !!s && sectionFilled(s.body)
}

function runCompliance(docs: DocEntry[]): AnalyzerReport {
  const now = new Date().toISOString()
  const assetTypes: DocType[] = ['server', 'network', 'storage', 'application']
  const assetDocs = docs.filter((d) => assetTypes.includes(d.type))
  const backupDocs = docs.filter((d) => d.type === 'backup')
  const policyDocs = docs.filter((d) => d.type === 'security')

  const groups: ControlGroup[] = []

  const assetItems = [
    { label: 'Server inventory documented', ok: docs.some((d) => d.type === 'server'), note: `${docs.filter((d) => d.type === 'server').length} server record(s)` },
    { label: 'Network inventory documented', ok: docs.some((d) => d.type === 'network'), note: `${docs.filter((d) => d.type === 'network').length} network record(s)` },
    { label: 'Every asset has an owner', ok: assetDocs.length > 0 && assetDocs.every((d) => d.owner && d.owner !== 'Unassigned'), note: `${assetDocs.filter((d) => !d.owner || d.owner === 'Unassigned').length} unassigned` },
    { label: 'Assets classified by criticality', ok: assetDocs.length > 0 && assetDocs.every((d) => !!d.criticality), note: 'Criticality set on all assets' },
  ]
  groups.push(buildGroup('Asset Management', 'ISO 27001 A.5.9 / NIST ID.AM', assetItems))

  const accessItems = [
    { label: 'Access & accounts documented', ok: assetDocs.length > 0 && assetDocs.every((d) => hasSectionFilled(d, 'Access & Accounts')), note: `${assetDocs.filter((d) => !hasSectionFilled(d, 'Access & Accounts')).length} missing access docs` },
    { label: 'Access control policy exists', ok: policyDocs.some((d) => /access/i.test(d.title) || /access/i.test(d.fields.policyArea ?? '')), note: policyDocs.length ? 'Policy present' : 'No policy found' },
  ]
  groups.push(buildGroup('Access Control', 'ISO 27001 A.5.15 / NIST PR.AC', accessItems))

  const opsItems = [
    { label: 'Monitoring documented for assets', ok: assetDocs.length > 0 && assetDocs.every((d) => hasSectionFilled(d, 'Monitoring')), note: `${assetDocs.filter((d) => !hasSectionFilled(d, 'Monitoring')).length} without monitoring docs` },
    { label: 'Dependencies mapped', ok: assetDocs.length > 0 && assetDocs.every((d) => hasSectionFilled(d, 'Dependencies')), note: 'Dependency sections complete' },
  ]
  groups.push(buildGroup('Operations Security', 'ISO 27001 A.8 / NIST PR.IP', opsItems))

  const backupItems = [
    { label: 'Backup procedures documented', ok: backupDocs.length > 0, note: `${backupDocs.length} backup record(s)` },
    { label: 'RPO defined', ok: backupDocs.length > 0 && backupDocs.every((d) => !!d.fields.rpo && !PLACEHOLDER.test(d.fields.rpo)), note: 'Recovery point objective set' },
    { label: 'RTO defined', ok: backupDocs.length > 0 && backupDocs.every((d) => !!d.fields.rto && !PLACEHOLDER.test(d.fields.rto)), note: 'Recovery time objective set' },
    { label: 'Restore procedure documented', ok: backupDocs.length > 0 && backupDocs.every((d) => hasSectionFilled(d, 'Restore Procedure')), note: 'Restore steps present' },
  ]
  groups.push(buildGroup('Backup & Recovery', 'ISO 27001 A.8.13 / NIST PR.IP-4', backupItems))

  const policyItems = [
    { label: 'Security policies documented', ok: policyDocs.length > 0, note: `${policyDocs.length} policy record(s)` },
    { label: 'Policies have a review cycle', ok: policyDocs.length > 0 && policyDocs.every((d) => !!d.fields.reviewCycle && !PLACEHOLDER.test(d.fields.reviewCycle)), note: 'Review cadence defined' },
  ]
  groups.push(buildGroup('Policies & Governance', 'ISO 27001 A.5.1 / NIST GV.PO', policyItems))

  const overall = Math.round(groups.reduce((s, g) => s + g.coverage, 0) / groups.length)
  const findings: Finding[] = []
  for (const g of groups) {
    const failed = g.items.filter((i) => !i.ok)
    for (const f of failed) {
      findings.push({
        severity: g.coverage < 50 ? 'critical' : 'warning',
        title: `${g.title}: ${f.label}`,
        detail: `${f.note}. Control reference ${g.reference}.`,
      })
    }
  }
  if (!findings.length) findings.push({ severity: 'ok', title: 'All mapped controls covered', detail: 'Documentation provides evidence for every evaluated control.' })

  return {
    kind: 'analyzer',
    agentId: 'compliance',
    agentName: 'Compliance Mapper',
    generatedAt: now,
    score: overall,
    scoreLabel: scoreLabel(overall),
    summary: `Mapped ${docs.length} document(s) to ${groups.length} control families. Overall control coverage ${overall}%.`,
    stats: [
      { label: 'Control families', value: String(groups.length) },
      { label: 'Controls covered', value: `${groups.reduce((s, g) => s + g.items.filter((i) => i.ok).length, 0)}/${groups.reduce((s, g) => s + g.items.length, 0)}` },
      { label: 'Overall coverage', value: `${overall}%` },
      { label: 'Open gaps', value: String(findings.filter((f) => f.severity !== 'ok').length) },
    ],
    findings,
    groups,
  }
}

function buildGroup(title: string, reference: string, items: { label: string; ok: boolean; note: string }[]): ControlGroup {
  const coverage = items.length ? Math.round((items.filter((i) => i.ok).length / items.length) * 100) : 0
  return { title, reference, coverage, items }
}

function runHygiene(docs: DocEntry[]): AnalyzerReport {
  const now = new Date().toISOString()
  const findings: Finding[] = []
  const STALE_DAYS = 180

  for (const doc of docs) {
    if (!doc.owner || doc.owner === 'Unassigned') {
      findings.push({ severity: 'warning', title: `${doc.title} has no owner`, detail: 'Assign an accountable owner or team.', docId: doc.id, docTitle: doc.title })
    }
    const age = daysSince(doc.updatedAt)
    if (age > STALE_DAYS) {
      findings.push({ severity: 'warning', title: `${doc.title} is stale`, detail: `Last reviewed ${age} days ago — exceeds the ${STALE_DAYS}-day review cycle.`, docId: doc.id, docTitle: doc.title })
    }
    if (doc.status === 'draft' && doc.environment === 'production') {
      findings.push({ severity: 'critical', title: `${doc.title} is a draft in production`, detail: 'Production systems should not rely on draft documentation. Review and publish.', docId: doc.id, docTitle: doc.title })
    }
    if (!doc.tags.length) {
      findings.push({ severity: 'info', title: `${doc.title} has no tags`, detail: 'Add tags to keep the library searchable.', docId: doc.id, docTitle: doc.title })
    }
  }

  const seen = new Map<string, string>()
  for (const doc of docs) {
    const ids = [doc.fields.hostname, doc.fields.ipAddress, doc.fields.mgmtIp].filter(Boolean) as string[]
    for (const id of ids) {
      const key = id.trim().toLowerCase()
      if (!key || PLACEHOLDER.test(key)) continue
      if (seen.has(key)) {
        findings.push({ severity: 'critical', title: `Duplicate identifier "${id}"`, detail: `Used by both "${seen.get(key)}" and "${doc.title}".`, docId: doc.id, docTitle: doc.title })
      } else {
        seen.set(key, doc.title)
      }
    }
  }

  const crit = findings.filter((f) => f.severity === 'critical').length
  const warn = findings.filter((f) => f.severity === 'warning').length
  const info = findings.filter((f) => f.severity === 'info').length
  const score = docs.length ? Math.max(0, 100 - crit * 20 - warn * 8 - info * 3) : 100
  if (!findings.length) findings.push({ severity: 'ok', title: 'Library is healthy', detail: 'No stale, ownerless or conflicting records detected.' })

  return {
    kind: 'analyzer',
    agentId: 'hygiene',
    agentName: 'Documentation Hygiene Agent',
    generatedAt: now,
    score,
    scoreLabel: scoreLabel(score),
    summary: `Checked ${docs.length} document(s). ${crit} critical, ${warn} warning, ${info} info finding(s).`,
    stats: [
      { label: 'Documents checked', value: String(docs.length) },
      { label: 'Critical', value: String(crit) },
      { label: 'Warnings', value: String(warn) },
      { label: 'Hygiene score', value: `${score}%` },
    ],
    findings,
  }
}

export function runAnalyzer(agentId: string, docs: DocEntry[]): AnalyzerReport {
  switch (agentId) {
    case 'compliance':
      return runCompliance(docs)
    case 'hygiene':
      return runHygiene(docs)
    case 'auditor':
    default:
      return runAuditor(docs)
  }
}
