import { prisma } from '../lib/prisma.js'
import { auditService } from './audit.service.js'

/**
 * TrustDoc Agent
 *
 * A deterministic, rule-based documentation expert. No generative AI involved:
 * every skill encodes IT-documentation best practice (NIST SP 800-123,
 * ISO 27001 inspired) as explicit checks. The agent perceives the workspace,
 * produces findings with a concrete proposed action, and only acts after the
 * user approves a finding.
 */

export type AgentSkillId = 'DOC_HEALTH' | 'TEMPLATE_COMPLIANCE' | 'COVERAGE_GAP' | 'REVIEW_CYCLE'

export interface AgentSkillDescriptor {
  id: AgentSkillId
  name: string
  description: string
  checks: string[]
}

export const AGENT_SKILLS: AgentSkillDescriptor[] = [
  {
    id: 'DOC_HEALTH',
    name: 'Documentation Health Scan',
    description:
      'Audits every document for substance and upkeep: empty or thin content, unfilled template placeholders, missing tags and drafts that have gone stale.',
    checks: ['Empty / thin content', 'Unfilled {{placeholders}} & TODO markers', 'Missing tags', 'Stuck drafts', 'Stale documents'],
  },
  {
    id: 'TEMPLATE_COMPLIANCE',
    name: 'Structure Compliance',
    description:
      'Verifies that server, network, backup and security documents contain the sections a complete runbook needs (hardware, network, security, backup, monitoring). Can append missing section skeletons.',
    checks: ['Required sections per document type', 'Section skeleton remediation'],
  },
  {
    id: 'COVERAGE_GAP',
    name: 'Infrastructure Coverage',
    description:
      'Cross-references the asset inventory with the documentation library and flags servers and network devices that have no documentation at all. Can scaffold a pre-filled document per asset.',
    checks: ['Undocumented servers & network devices', 'Pre-filled document scaffolding'],
  },
  {
    id: 'REVIEW_CYCLE',
    name: 'Review Cycle Guard',
    description:
      'Enforces review hygiene: published documents that have not been touched within their review window are queued for review, with security-relevant content prioritised.',
    checks: ['90-day review window', 'Security content prioritisation'],
  },
]

// ---------------------------------------------------------------------------
// Domain knowledge
// ---------------------------------------------------------------------------

const STALE_DAYS = 180
const STUCK_DRAFT_DAYS = 30
const REVIEW_WINDOW_DAYS = 90

const SECURITY_KEYWORDS = ['security', 'sicherheit', 'firewall', 'password', 'passwort', 'zertifikat', 'certificate', 'vpn', 'zugriff', 'access', 'verschlüsselung', 'encryption']

const DOC_TYPE_SECTIONS: Array<{ match: string[]; label: string; sections: Array<{ key: string[]; title: string; skeleton: string }> }> = [
  {
    match: ['policy', 'richtlinie', 'security policy', 'sicherheitsrichtlinie'],
    label: 'Security policy',
    sections: [
      { key: ['geltungsbereich', 'scope', 'zweck', 'purpose'], title: 'Geltungsbereich & Zweck', skeleton: '<h2>Geltungsbereich &amp; Zweck</h2><p>Für welche Systeme und Teams gilt diese Richtlinie?</p>' },
      { key: ['rollen', 'verantwortlich', 'roles', 'responsib'], title: 'Rollen & Verantwortlichkeiten', skeleton: '<h2>Rollen &amp; Verantwortlichkeiten</h2><ul><li>Owner: </li><li>Umsetzung: </li></ul>' },
      { key: ['regel', 'rules', 'vorgaben', 'requirements'], title: 'Regeln & Vorgaben', skeleton: '<h2>Regeln &amp; Vorgaben</h2><ol><li>Regel 1: </li></ol>' },
      { key: ['ausnahme', 'exception'], title: 'Ausnahmen', skeleton: '<h2>Ausnahmen</h2><p>Genehmigte Ausnahmen und deren Ablaufdatum.</p>' },
      { key: ['review', 'überprüfung'], title: 'Review-Zyklus', skeleton: '<h2>Review-Zyklus</h2><p>Diese Richtlinie wird alle 12 Monate überprüft. Nächstes Review: </p>' },
    ],
  },
  {
    match: ['backup', 'disaster', 'recovery', 'restore'],
    label: 'Backup / DR documentation',
    sections: [
      { key: ['zeitplan', 'schedule'], title: 'Backup-Zeitplan', skeleton: '<h2>Backup-Zeitplan</h2><ul><li>Vollbackup: </li><li>Inkrementell: </li></ul>' },
      { key: ['aufbewahrung', 'retention'], title: 'Aufbewahrungsrichtlinie', skeleton: '<h2>Aufbewahrungsrichtlinie</h2><ul><li>Täglich: </li><li>Wöchentlich: </li><li>Monatlich: </li></ul>' },
      { key: ['wiederherstellung', 'recovery', 'restore'], title: 'Wiederherstellungsverfahren', skeleton: '<h2>Wiederherstellungsverfahren</h2><ol><li>Schritt 1: </li></ol>' },
      { key: ['test'], title: 'Backup-Testverfahren', skeleton: '<h2>Backup-Testverfahren</h2><ul><li>Test-Intervall: </li><li>Letzter Test: </li></ul>' },
    ],
  },
  {
    match: ['netzwerk', 'network', 'switch', 'router', 'firewall', 'wlan', 'vlan'],
    label: 'Network documentation',
    sections: [
      { key: ['topologie', 'topology'], title: 'Topologie', skeleton: '<h2>Topologie</h2><p>Netzwerk-Topologie und Diagramm-Referenz.</p>' },
      { key: ['ip-adress', 'ip address', 'adressierung'], title: 'IP-Adressierung', skeleton: '<h2>IP-Adressierung</h2><ul><li>Subnetze: </li><li>VLANs: </li><li>DHCP-Bereiche: </li></ul>' },
      { key: ['sicherheit', 'security', 'acl', 'regel'], title: 'Sicherheitskonfiguration', skeleton: '<h2>Sicherheitskonfiguration</h2><ul><li>ACLs: </li><li>Segmentierung: </li></ul>' },
      { key: ['monitoring', 'überwachung', 'wartung'], title: 'Monitoring & Wartung', skeleton: '<h2>Monitoring &amp; Wartung</h2><ul><li>Monitoring: </li><li>Wartungsfenster: </li></ul>' },
    ],
  },
  {
    match: ['server', 'hypervisor', 'vmware', 'esxi', 'hyper-v', 'proxmox', 'virtual machine'],
    label: 'Server documentation',
    sections: [
      { key: ['hardware'], title: 'Hardware', skeleton: '<h2>Hardware</h2><ul><li>CPU: </li><li>RAM: </li><li>Storage: </li></ul>' },
      { key: ['netzwerk', 'network'], title: 'Netzwerk-Konfiguration', skeleton: '<h2>Netzwerk-Konfiguration</h2><ul><li>IP-Adresse: </li><li>Subnetz: </li><li>Gateway: </li><li>DNS: </li></ul>' },
      { key: ['sicherheit', 'security'], title: 'Sicherheitskonfiguration', skeleton: '<h2>Sicherheitskonfiguration</h2><ul><li>Firewall-Regeln: </li><li>Zugriffskontrolle: </li><li>Patch-Stand: </li></ul>' },
      { key: ['backup'], title: 'Backup', skeleton: '<h2>Backup</h2><ul><li>Backup-Methode: </li><li>Zeitplan: </li><li>Aufbewahrung: </li><li>Letzter Restore-Test: </li></ul>' },
      { key: ['monitoring', 'überwachung'], title: 'Monitoring', skeleton: '<h2>Monitoring</h2><ul><li>Monitoring-System: </li><li>Alarme: </li><li>Eskalation: </li></ul>' },
    ],
  },
]

const TAG_KEYWORDS: Record<string, string[]> = {
  server: ['server', 'host', 'hypervisor', 'vmware', 'hyper-v', 'proxmox'],
  network: ['netzwerk', 'network', 'switch', 'router', 'vlan', 'wlan', 'dns', 'dhcp'],
  security: ['firewall', 'security', 'sicherheit', 'vpn', 'zertifikat', 'certificate'],
  backup: ['backup', 'restore', 'recovery', 'veeam'],
  monitoring: ['monitoring', 'überwachung', 'zabbix', 'icinga', 'grafana'],
  database: ['datenbank', 'database', 'sql', 'postgres', 'oracle'],
  cloud: ['azure', 'aws', 'cloud', 'm365', 'office 365'],
  linux: ['linux', 'debian', 'ubuntu', 'redhat'],
  windows: ['windows', 'active directory', 'gpo'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function suggestTags(title: string, content: string): string[] {
  const haystack = `${title} ${stripHtml(content)}`.toLowerCase()
  const tags = Object.entries(TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => haystack.includes(k)))
    .map(([tag]) => tag)
  return tags.slice(0, 5)
}

function matchDocType(title: string, content: string) {
  const haystack = `${title} ${stripHtml(content).slice(0, 600)}`.toLowerCase()
  return DOC_TYPE_SECTIONS.find((t) => t.match.some((m) => haystack.includes(m))) ?? null
}

interface NewFinding {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  detail?: string
  documentId?: string
  assetId?: string
  proposedAction?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

type Doc = { id: string; title: string; content: string; category: string; status: string; tags: string | null; updatedAt: Date }

function checkDocHealth(doc: Doc): NewFinding[] {
  const findings: NewFinding[] = []
  const text = stripHtml(doc.content || '')
  const age = daysSince(doc.updatedAt)

  if (text.length < 120) {
    const docType = matchDocType(doc.title, doc.content || '')
    findings.push({
      type: 'EMPTY_CONTENT',
      severity: 'HIGH',
      message: `"${doc.title}" has almost no content (${text.length} characters).`,
      detail: 'A document this thin provides no operational value. The agent can append a best-practice section skeleton to fill in.',
      documentId: doc.id,
      proposedAction: docType
        ? { action: 'APPEND_SECTIONS', sections: docType.sections.map((s) => s.skeleton), label: `Append ${docType.label} skeleton` }
        : undefined,
    })
  }

  const placeholders = (doc.content || '').match(/\{\{\s*[\w.-]+\s*\}\}/g) ?? []
  const todos = stripHtml(doc.content || '').match(/\b(TODO|TBD|FIXME|XXX)\b/g) ?? []
  if (placeholders.length > 0 || todos.length >= 2) {
    findings.push({
      type: 'UNFILLED_PLACEHOLDERS',
      severity: 'MEDIUM',
      message: `"${doc.title}" still contains ${placeholders.length > 0 ? `${placeholders.length} unfilled template placeholder(s)` : `${todos.length} TODO/TBD marker(s)`}.`,
      detail: placeholders.length > 0 ? `Placeholders: ${[...new Set(placeholders)].slice(0, 8).join(', ')}` : 'Resolve open TODO markers before publishing.',
      documentId: doc.id,
    })
  }

  let tags: string[] = []
  try {
    tags = doc.tags ? JSON.parse(doc.tags) : []
  } catch {
    tags = []
  }
  if (tags.length === 0) {
    const suggested = suggestTags(doc.title, doc.content || '')
    if (suggested.length > 0) {
      findings.push({
        type: 'MISSING_TAGS',
        severity: 'LOW',
        message: `"${doc.title}" has no tags — hard to find via search and filters.`,
        detail: `Suggested tags based on content analysis: ${suggested.join(', ')}`,
        documentId: doc.id,
        proposedAction: { action: 'ADD_TAGS', tags: suggested, label: `Add tags: ${suggested.join(', ')}` },
      })
    }
  }

  if (doc.status === 'DRAFT' && age > STUCK_DRAFT_DAYS) {
    findings.push({
      type: 'STUCK_DRAFT',
      severity: 'MEDIUM',
      message: `"${doc.title}" has been a draft for ${age} days.`,
      detail: 'Long-lived drafts tend to be forgotten. Move it into review so it gets finished or archived.',
      documentId: doc.id,
      proposedAction: { action: 'SET_STATUS', status: 'REVIEW', label: 'Move to review' },
    })
  }

  if (age > STALE_DAYS && doc.status !== 'ARCHIVED') {
    findings.push({
      type: 'STALE_DOCUMENT',
      severity: 'HIGH',
      message: `"${doc.title}" has not been updated in ${age} days.`,
      detail: `IT documentation older than ${STALE_DAYS} days is likely out of sync with the real environment.`,
      documentId: doc.id,
      proposedAction: { action: 'SET_STATUS', status: 'REVIEW', label: 'Queue for review' },
    })
  }

  return findings
}

function checkTemplateCompliance(doc: Doc): NewFinding[] {
  if (doc.status === 'ARCHIVED') return []
  const docType = matchDocType(doc.title, doc.content || '')
  if (!docType) return []

  const haystack = stripHtml(doc.content || '').toLowerCase()
  const missing = docType.sections.filter((section) => !section.key.some((k) => haystack.includes(k)))
  if (missing.length === 0) return []

  return [
    {
      type: 'MISSING_SECTIONS',
      severity: missing.length >= 3 ? 'HIGH' : 'MEDIUM',
      message: `"${doc.title}" (${docType.label}) is missing ${missing.length} required section(s): ${missing.map((s) => s.title).join(', ')}.`,
      detail: 'A complete document of this type should cover all standard sections so on-call engineers find what they need.',
      documentId: doc.id,
      proposedAction: {
        action: 'APPEND_SECTIONS',
        sections: missing.map((s) => s.skeleton),
        label: `Append section skeletons: ${missing.map((s) => s.title).join(', ')}`,
      },
    },
  ]
}

const CRITICAL_ASSET_TYPES = ['SERVER', 'FIREWALL', 'ROUTER', 'SWITCH', 'STORAGE']

function assetDocumentSkeleton(asset: { name: string; type: string; manufacturer: string | null; model: string | null; ipAddress: string | null; hostname: string | null; location: string | null; serialNumber: string | null }): string {
  return [
    `<h1>${asset.name} – ${asset.type} Documentation</h1>`,
    '<h2>Basis-Informationen</h2>',
    '<table><tbody>',
    `<tr><td><strong>Name:</strong></td><td>${asset.name}</td></tr>`,
    `<tr><td><strong>Typ:</strong></td><td>${asset.type}</td></tr>`,
    `<tr><td><strong>Hersteller / Modell:</strong></td><td>${[asset.manufacturer, asset.model].filter(Boolean).join(' ') || '–'}</td></tr>`,
    `<tr><td><strong>Hostname:</strong></td><td>${asset.hostname || '–'}</td></tr>`,
    `<tr><td><strong>IP-Adresse:</strong></td><td>${asset.ipAddress || '–'}</td></tr>`,
    `<tr><td><strong>Seriennummer:</strong></td><td>${asset.serialNumber || '–'}</td></tr>`,
    `<tr><td><strong>Standort:</strong></td><td>${asset.location || '–'}</td></tr>`,
    '</tbody></table>',
    '<h2>Hardware</h2><ul><li>CPU: </li><li>RAM: </li><li>Storage: </li></ul>',
    '<h2>Netzwerk-Konfiguration</h2><ul><li>Subnetz: </li><li>Gateway: </li><li>DNS: </li></ul>',
    '<h2>Sicherheitskonfiguration</h2><ul><li>Firewall-Regeln: </li><li>Zugriffskontrolle: </li><li>Patch-Stand: </li></ul>',
    '<h2>Backup</h2><ul><li>Backup-Methode: </li><li>Zeitplan: </li><li>Letzter Restore-Test: </li></ul>',
    '<h2>Monitoring</h2><ul><li>Monitoring-System: </li><li>Alarme: </li></ul>',
  ].join('')
}

function checkReviewCycle(doc: Doc): NewFinding[] {
  if (doc.status !== 'PUBLISHED') return []
  const age = daysSince(doc.updatedAt)
  if (age <= REVIEW_WINDOW_DAYS) return []

  const haystack = `${doc.title} ${stripHtml(doc.content || '').slice(0, 800)}`.toLowerCase()
  const securityRelevant = SECURITY_KEYWORDS.some((k) => haystack.includes(k))

  return [
    {
      type: 'REVIEW_OVERDUE',
      severity: securityRelevant ? 'CRITICAL' : 'MEDIUM',
      message: `"${doc.title}" was published ${age} days ago and is past its ${REVIEW_WINDOW_DAYS}-day review window${securityRelevant ? ' (security-relevant content)' : ''}.`,
      detail: securityRelevant
        ? 'Security-relevant documentation must be reviewed regularly — outdated firewall rules or access lists are an operational risk.'
        : 'Regular reviews keep published documentation trustworthy.',
      documentId: doc.id,
      proposedAction: { action: 'SET_STATUS', status: 'REVIEW', label: 'Queue for review' },
    },
  ]
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const agentService = {
  getSkills(): AgentSkillDescriptor[] {
    return AGENT_SKILLS
  },

  async runSkill(skill: AgentSkillId, ctx: { tenantId?: string | null; userId?: string | null }) {
    const run = await prisma.agentRun.create({
      data: { skill, tenantId: ctx.tenantId ?? null, userId: ctx.userId ?? null },
    })

    try {
      const docWhere = ctx.tenantId ? { tenantId: ctx.tenantId } : {}
      const findings: NewFinding[] = []
      let scanned = 0

      if (skill === 'COVERAGE_GAP') {
        const [assets, documents] = await Promise.all([
          prisma.asset.findMany({ where: { ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}), status: 'ACTIVE' } }),
          prisma.document.findMany({ where: docWhere, select: { title: true, content: true } }),
        ])
        scanned = assets.length
        const corpus = documents.map((d) => `${d.title} ${stripHtml(d.content)}`.toLowerCase())

        for (const asset of assets) {
          const needles = [asset.name, asset.hostname, asset.ipAddress].filter((n): n is string => !!n && n.length >= 3).map((n) => n.toLowerCase())
          const documented = needles.length > 0 && corpus.some((text) => needles.some((n) => text.includes(n)))
          if (!documented) {
            const critical = CRITICAL_ASSET_TYPES.includes(asset.type)
            findings.push({
              type: 'UNDOCUMENTED_ASSET',
              severity: critical ? 'HIGH' : 'MEDIUM',
              message: `${asset.type.toLowerCase()} "${asset.name}" has no documentation referencing it.`,
              detail: `No document mentions ${needles.join(', ') || asset.name}. ${critical ? 'Critical infrastructure must be documented.' : ''}`.trim(),
              assetId: asset.id,
              proposedAction: {
                action: 'CREATE_DOCUMENT',
                title: `${asset.name} – ${asset.type} Documentation`,
                category: 'DOCUMENTATION',
                content: assetDocumentSkeleton(asset),
                label: `Create pre-filled document for ${asset.name}`,
              },
            })
          }
        }
      } else {
        const documents = await prisma.document.findMany({
          where: docWhere,
          select: { id: true, title: true, content: true, category: true, status: true, tags: true, updatedAt: true },
        })
        scanned = documents.length
        const checker = skill === 'DOC_HEALTH' ? checkDocHealth : skill === 'TEMPLATE_COMPLIANCE' ? checkTemplateCompliance : checkReviewCycle
        for (const doc of documents) {
          findings.push(...checker(doc))
        }
      }

      // Skip findings already open for the same document/asset & type
      const existing = await prisma.agentFinding.findMany({
        where: { status: 'OPEN', skill, ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}) },
        select: { type: true, documentId: true, assetId: true },
      })
      const existingKeys = new Set(existing.map((f) => `${f.type}:${f.documentId ?? ''}:${f.assetId ?? ''}`))
      const fresh = findings.filter((f) => !existingKeys.has(`${f.type}:${f.documentId ?? ''}:${f.assetId ?? ''}`))

      if (fresh.length > 0) {
        await prisma.agentFinding.createMany({
          data: fresh.map((f) => ({
            runId: run.id,
            skill,
            type: f.type,
            severity: f.severity,
            message: f.message,
            detail: f.detail ?? null,
            documentId: f.documentId ?? null,
            assetId: f.assetId ?? null,
            proposedAction: f.proposedAction ? JSON.stringify(f.proposedAction) : null,
            tenantId: ctx.tenantId ?? null,
          })),
        })
      }

      const bySeverity = fresh.reduce<Record<string, number>>((acc, f) => {
        acc[f.severity] = (acc[f.severity] ?? 0) + 1
        return acc
      }, {})

      const summary = { scanned, findings: fresh.length, duplicatesSkipped: findings.length - fresh.length, bySeverity }
      const completed = await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: 'COMPLETED', finishedAt: new Date(), summary: JSON.stringify(summary) },
        include: { findings: true },
      })

      await auditService.log({
        userId: ctx.userId ?? undefined,
        action: 'AGENT_RUN',
        resource: 'AgentRun',
        resourceId: run.id,
        metadata: { skill, ...summary },
      })

      return completed
    } catch (error) {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', finishedAt: new Date(), summary: JSON.stringify({ error: (error as Error).message }) },
      })
      throw error
    }
  },

  async getRuns(ctx: { tenantId?: string | null }, limit = 10) {
    return prisma.agentRun.findMany({
      where: ctx.tenantId ? { tenantId: ctx.tenantId } : {},
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { _count: { select: { findings: true } } },
    })
  },

  async getFindings(ctx: { tenantId?: string | null }, status?: string) {
    return prisma.agentFinding.findMany({
      where: {
        ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    })
  },

  async applyFinding(findingId: string, ctx: { tenantId?: string | null; userId?: string | null }) {
    const finding = await prisma.agentFinding.findFirst({
      where: { id: findingId, ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}) },
    })
    if (!finding) throw Object.assign(new Error('Finding not found'), { statusCode: 404 })
    if (finding.status !== 'OPEN') throw Object.assign(new Error('Finding is already resolved'), { statusCode: 400 })
    if (!finding.proposedAction) throw Object.assign(new Error('Finding has no automatic remediation — fix it manually'), { statusCode: 400 })

    const action = JSON.parse(finding.proposedAction) as Record<string, any>
    let result: Record<string, unknown> = {}

    switch (action.action) {
      case 'SET_STATUS': {
        if (!finding.documentId) throw new Error('Missing document reference')
        const doc = await prisma.document.update({
          where: { id: finding.documentId },
          data: { status: String(action.status), version: { increment: 1 } },
        })
        result = { documentId: doc.id, status: doc.status }
        break
      }
      case 'ADD_TAGS': {
        if (!finding.documentId) throw new Error('Missing document reference')
        const doc = await prisma.document.findUnique({ where: { id: finding.documentId } })
        if (!doc) throw new Error('Document no longer exists')
        let tags: string[] = []
        try {
          tags = doc.tags ? JSON.parse(doc.tags) : []
        } catch {
          tags = []
        }
        const merged = [...new Set([...tags, ...(action.tags as string[])])]
        await prisma.document.update({ where: { id: doc.id }, data: { tags: JSON.stringify(merged) } })
        result = { documentId: doc.id, tags: merged }
        break
      }
      case 'APPEND_SECTIONS': {
        if (!finding.documentId) throw new Error('Missing document reference')
        const doc = await prisma.document.findUnique({ where: { id: finding.documentId } })
        if (!doc) throw new Error('Document no longer exists')
        const appended = `${doc.content}${(action.sections as string[]).join('')}`
        await prisma.document.update({
          where: { id: doc.id },
          data: { content: appended, version: { increment: 1 } },
        })
        result = { documentId: doc.id, sectionsAdded: (action.sections as string[]).length }
        break
      }
      case 'CREATE_DOCUMENT': {
        if (!ctx.userId) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
        const doc = await prisma.document.create({
          data: {
            title: String(action.title),
            content: String(action.content),
            category: String(action.category ?? 'DOCUMENTATION'),
            status: 'DRAFT',
            tenantId: ctx.tenantId ?? null,
            userId: ctx.userId,
            metadata: finding.assetId ? JSON.stringify({ assetId: finding.assetId, createdByAgent: true }) : JSON.stringify({ createdByAgent: true }),
          },
        })
        result = { documentId: doc.id, title: doc.title }
        break
      }
      default:
        throw Object.assign(new Error(`Unknown action: ${action.action}`), { statusCode: 400 })
    }

    const updated = await prisma.agentFinding.update({
      where: { id: finding.id },
      data: { status: 'APPLIED', resolvedAt: new Date() },
    })

    await auditService.log({
      userId: ctx.userId ?? undefined,
      action: 'AGENT_APPLY',
      resource: 'AgentFinding',
      resourceId: finding.id,
      metadata: { type: finding.type, action: action.action, result },
    })

    return { finding: updated, result }
  },

  async dismissFinding(findingId: string, ctx: { tenantId?: string | null; userId?: string | null }) {
    const finding = await prisma.agentFinding.findFirst({
      where: { id: findingId, ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}) },
    })
    if (!finding) throw Object.assign(new Error('Finding not found'), { statusCode: 404 })
    if (finding.status !== 'OPEN') throw Object.assign(new Error('Finding is already resolved'), { statusCode: 400 })

    const updated = await prisma.agentFinding.update({
      where: { id: finding.id },
      data: { status: 'DISMISSED', resolvedAt: new Date() },
    })

    await auditService.log({
      userId: ctx.userId ?? undefined,
      action: 'AGENT_DISMISS',
      resource: 'AgentFinding',
      resourceId: finding.id,
      metadata: { type: finding.type },
    })

    return updated
  },
}
