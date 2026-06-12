/**
 * Trust Doc agent skills.
 *
 * Each skill is an autonomous routine that inspects the documentation and
 * inventory, reports findings and - where safe - acts on them (creating
 * skeleton documents, flagging stale ones). Skills are deterministic and
 * rule-based: the expertise lives in the knowledge base, not in an LLM.
 */

import { prisma } from '../lib/prisma.js'
import { parseJson } from '../lib/json.js'
import {
  AssetLike,
  AssetType,
  COVERAGE_REQUIREMENTS,
  CRITICAL_EXTRA_CATEGORY,
  DocumentCategory,
  MIN_CONTENT_LENGTH,
  PLACEHOLDER_PATTERNS,
  REQUIRED_SECTIONS,
  REVIEW_INTERVAL_DAYS,
  buildAssetDocument,
} from './knowledge.js'

export type Severity = 'info' | 'warning' | 'critical'

export interface RunStep {
  label: string
  detail: string
}

export interface Finding {
  severity: Severity
  title: string
  detail: string
  documentId?: string
  assetId?: string
}

export interface RunAction {
  type: 'created_document' | 'flagged_document'
  label: string
  documentId?: string
}

export interface SkillResult {
  summary: string
  steps: RunStep[]
  findings: Finding[]
  actions: RunAction[]
}

export interface SkillDefinition {
  id: string
  name: string
  description: string
  /** What the skill changes, shown to the user before running. */
  writes: string
  inputs: { key: string; label: string; type: 'boolean' | 'assetId'; default?: boolean }[]
  run: (input: Record<string, unknown>) => Promise<SkillResult>
}

const plainText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const headingsOf = (html: string): string[] => {
  const matches = html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)
  return [...matches].map((m) => plainText(m[1]).toLowerCase())
}

const categoryOf = (raw: string): DocumentCategory =>
  (REQUIRED_SECTIONS as Record<string, unknown>)[raw] ? (raw as DocumentCategory) : 'GENERAL'

const assetTypeOf = (raw: string): AssetType =>
  (COVERAGE_REQUIREMENTS as Record<string, unknown>)[raw] ? (raw as AssetType) : 'SERVER'

const daysSince = (date: Date) => Math.floor((Date.now() - date.getTime()) / 86_400_000)

/* ------------------------------------------------------------------ */
/* Skill: Coverage Analysis                                            */
/* ------------------------------------------------------------------ */

async function runCoverageAnalysis(input: Record<string, unknown>): Promise<SkillResult> {
  const autofix = input.autofix === true
  const steps: RunStep[] = []
  const findings: Finding[] = []
  const actions: RunAction[] = []

  const assets = await prisma.asset.findMany({
    where: { status: { not: 'RETIRED' } },
    include: { documents: { select: { id: true, category: true, status: true } } },
  })
  steps.push({
    label: 'Scanned inventory',
    detail: `Loaded ${assets.length} active assets with their linked documents.`,
  })

  let requiredTotal = 0
  let coveredTotal = 0
  const gaps: { asset: (typeof assets)[number]; category: DocumentCategory }[] = []

  for (const asset of assets) {
    const required = new Set<DocumentCategory>(COVERAGE_REQUIREMENTS[assetTypeOf(asset.type)])
    if (asset.criticality === 'CRITICAL') required.add(CRITICAL_EXTRA_CATEGORY)

    const present = new Set(asset.documents.filter((d) => d.status !== 'ARCHIVED').map((d) => d.category))

    for (const category of required) {
      requiredTotal += 1
      if (present.has(category)) {
        coveredTotal += 1
      } else {
        gaps.push({ asset, category })
        findings.push({
          severity: asset.criticality === 'CRITICAL' ? 'critical' : 'warning',
          title: `${asset.name}: missing ${category} documentation`,
          detail: `A ${asset.type.toLowerCase().replace(/_/g, ' ')} with criticality ${asset.criticality} requires ${category} documentation, but none is linked.`,
          assetId: asset.id,
        })
      }
    }
  }

  steps.push({
    label: 'Checked coverage rules',
    detail: `${requiredTotal} required documents across the inventory, ${coveredTotal} present, ${gaps.length} missing.`,
  })

  if (autofix && gaps.length > 0) {
    for (const gap of gaps) {
      const draft = buildAssetDocument(gap.asset as AssetLike, gap.category)
      const doc = await prisma.document.create({
        data: {
          title: draft.title,
          content: draft.content,
          category: gap.category,
          status: 'DRAFT',
          assetId: gap.asset.id,
          generatedBy: 'coverage-analysis',
          tags: JSON.stringify(['agent-generated', gap.category.toLowerCase()]),
        },
      })
      actions.push({
        type: 'created_document',
        label: `Created draft "${draft.title}"`,
        documentId: doc.id,
      })
    }
    steps.push({
      label: 'Closed gaps',
      detail: `Generated ${gaps.length} structured draft documents pre-filled from the inventory.`,
    })
  } else if (gaps.length > 0) {
    steps.push({
      label: 'Auto-fix disabled',
      detail: 'Re-run with auto-fix enabled to let the agent create the missing drafts.',
    })
  }

  const coverage = requiredTotal === 0 ? 100 : Math.round((coveredTotal / requiredTotal) * 100)
  const summary =
    gaps.length === 0
      ? `Coverage is complete: all ${requiredTotal} required documents exist for ${assets.length} assets.`
      : autofix
        ? `Coverage was ${coverage}%. The agent created ${actions.length} draft documents to close every gap.`
        : `Coverage is ${coverage}%: ${gaps.length} required documents are missing across ${assets.length} assets.`

  return { summary, steps, findings, actions }
}

/* ------------------------------------------------------------------ */
/* Skill: Health Audit                                                 */
/* ------------------------------------------------------------------ */

async function runHealthAudit(input: Record<string, unknown>): Promise<SkillResult> {
  const flagStale = input.flag !== false
  const steps: RunStep[] = []
  const findings: Finding[] = []
  const actions: RunAction[] = []

  const documents = await prisma.document.findMany({ where: { status: { not: 'ARCHIVED' } } })
  steps.push({
    label: 'Loaded documents',
    detail: `Auditing ${documents.length} active documents against the structure, completeness and freshness rules.`,
  })

  let structureIssues = 0
  let placeholderIssues = 0
  let staleDocs = 0
  let thinDocs = 0

  for (const doc of documents) {
    const category = categoryOf(doc.category)
    const headings = headingsOf(doc.content)
    const text = plainText(doc.content)

    const missing = REQUIRED_SECTIONS[category].filter(
      (rule) => !headings.some((h) => h.includes(rule.heading.toLowerCase()))
    )
    if (missing.length > 0) {
      structureIssues += 1
      findings.push({
        severity: missing.length >= 3 ? 'critical' : 'warning',
        title: `"${doc.title}" is missing ${missing.length} required section${missing.length > 1 ? 's' : ''}`,
        detail: missing.map((m) => `${m.heading} (${m.rationale.toLowerCase()})`).join('; '),
        documentId: doc.id,
      })
    }

    if (PLACEHOLDER_PATTERNS.some((p) => p.test(doc.content))) {
      placeholderIssues += 1
      findings.push({
        severity: 'warning',
        title: `"${doc.title}" contains unfinished placeholders`,
        detail: 'The document contains TODO/TBD markers or unresolved template fields and is not reliable in an incident.',
        documentId: doc.id,
      })
    }

    if (text.length < MIN_CONTENT_LENGTH) {
      thinDocs += 1
      findings.push({
        severity: 'warning',
        title: `"${doc.title}" has too little substance`,
        detail: `Only ${text.length} characters of actual content - too thin to be useful as ${category} documentation.`,
        documentId: doc.id,
      })
    }

    const referenceDate = doc.reviewedAt ?? doc.updatedAt
    const age = daysSince(referenceDate)
    const maxAge = REVIEW_INTERVAL_DAYS[category]
    if (age > maxAge) {
      staleDocs += 1
      findings.push({
        severity: age > maxAge * 2 ? 'critical' : 'warning',
        title: `"${doc.title}" is stale (${age} days without review)`,
        detail: `${category} documentation must be reviewed every ${maxAge} days.`,
        documentId: doc.id,
      })
      if (flagStale && doc.status === 'PUBLISHED') {
        await prisma.document.update({ where: { id: doc.id }, data: { status: 'NEEDS_REVIEW' } })
        actions.push({
          type: 'flagged_document',
          label: `Flagged "${doc.title}" for review`,
          documentId: doc.id,
        })
      }
    }
  }

  steps.push({
    label: 'Applied expert rules',
    detail: `${structureIssues} structure issues, ${placeholderIssues} documents with placeholders, ${thinDocs} thin documents, ${staleDocs} stale documents.`,
  })
  if (actions.length > 0) {
    steps.push({
      label: 'Flagged stale documents',
      detail: `${actions.length} published documents moved to "Needs review" so they show up in the team's queue.`,
    })
  }

  const healthy = documents.length - new Set(findings.map((f) => f.documentId)).size
  const summary =
    findings.length === 0
      ? `All ${documents.length} documents pass the audit - structure, completeness and freshness are in order.`
      : `${healthy} of ${documents.length} documents are healthy. Found ${findings.length} issues${actions.length > 0 ? ` and flagged ${actions.length} documents for review` : ''}.`

  return { summary, steps, findings, actions }
}

/* ------------------------------------------------------------------ */
/* Skill: Asset Documentation Generator                                */
/* ------------------------------------------------------------------ */

async function runAssetDocGenerator(input: Record<string, unknown>): Promise<SkillResult> {
  const assetId = typeof input.assetId === 'string' ? input.assetId : undefined
  const steps: RunStep[] = []
  const findings: Finding[] = []
  const actions: RunAction[] = []

  const assets = await prisma.asset.findMany({
    where: assetId ? { id: assetId } : { status: { not: 'RETIRED' } },
    include: { documents: { select: { category: true, status: true } } },
  })
  if (assetId && assets.length === 0) {
    throw new Error('Asset not found')
  }
  steps.push({
    label: 'Selected targets',
    detail: assetId
      ? `Generating the full documentation set for ${assets[0].name}.`
      : `Checking ${assets.length} active assets for missing documentation sets.`,
  })

  let created = 0
  for (const asset of assets) {
    const required = new Set<DocumentCategory>(COVERAGE_REQUIREMENTS[assetTypeOf(asset.type)])
    if (asset.criticality === 'CRITICAL') required.add(CRITICAL_EXTRA_CATEGORY)
    const present = new Set(asset.documents.filter((d) => d.status !== 'ARCHIVED').map((d) => d.category))

    for (const category of required) {
      if (present.has(category)) continue
      const draft = buildAssetDocument(asset as AssetLike, category)
      const doc = await prisma.document.create({
        data: {
          title: draft.title,
          content: draft.content,
          category,
          status: 'DRAFT',
          assetId: asset.id,
          generatedBy: 'asset-doc-generator',
          tags: JSON.stringify(['agent-generated', category.toLowerCase()]),
        },
      })
      created += 1
      actions.push({ type: 'created_document', label: `Created draft "${draft.title}"`, documentId: doc.id })
      findings.push({
        severity: 'info',
        title: `Draft created for ${asset.name}`,
        detail: `${category} documentation skeleton pre-filled with inventory facts. Sections marked "to be completed" need engineer input.`,
        documentId: doc.id,
        assetId: asset.id,
      })
    }
  }

  steps.push({
    label: 'Generated drafts',
    detail:
      created === 0
        ? 'Nothing to generate - every required document already exists.'
        : `Created ${created} structured drafts from the inventory.`,
  })

  const summary =
    created === 0
      ? 'Documentation set already complete - no drafts needed.'
      : `Generated ${created} structured draft document${created > 1 ? 's' : ''} ready for engineer review.`

  return { summary, steps, findings, actions }
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const SKILLS: SkillDefinition[] = [
  {
    id: 'coverage-analysis',
    name: 'Coverage Analysis',
    description:
      'Cross-references the asset inventory with the document library and reports every asset that is missing required documentation (servers need system + backup docs, firewalls need network + security docs, critical assets need runbooks).',
    writes: 'With auto-fix enabled, creates pre-filled draft documents for every gap.',
    inputs: [{ key: 'autofix', label: 'Auto-create missing drafts', type: 'boolean', default: false }],
    run: runCoverageAnalysis,
  },
  {
    id: 'health-audit',
    name: 'Health Audit',
    description:
      'Audits every document against IT documentation best practice: required sections per category, unfinished placeholders (TODO/TBD), substance and review freshness (security docs every 90 days, server docs every 180 days).',
    writes: 'Moves stale published documents to "Needs review".',
    inputs: [{ key: 'flag', label: 'Flag stale documents for review', type: 'boolean', default: true }],
    run: runHealthAudit,
  },
  {
    id: 'asset-doc-generator',
    name: 'Asset Doc Generator',
    description:
      'Generates the complete documentation set for an asset (or all assets) straight from the inventory: correct structure for the asset type, facts pre-filled, open points clearly marked for engineers.',
    writes: 'Creates draft documents linked to the asset.',
    inputs: [{ key: 'assetId', label: 'Limit to a single asset', type: 'assetId' }],
    run: runAssetDocGenerator,
  },
]

export const getSkill = (id: string) => SKILLS.find((s) => s.id === id)

/** Executes a skill and persists the run with steps, findings and actions. */
export async function executeSkill(skillId: string, input: Record<string, unknown>) {
  const skill = getSkill(skillId)
  if (!skill) throw new Error(`Unknown skill: ${skillId}`)

  const startedAt = Date.now()
  const run = await prisma.agentRun.create({
    data: {
      skillId: skill.id,
      skillName: skill.name,
      status: 'RUNNING',
      input: JSON.stringify(input ?? {}),
    },
  })

  try {
    const result = await skill.run(input ?? {})
    return await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        summary: result.summary,
        steps: JSON.stringify(result.steps),
        findings: JSON.stringify(result.findings),
        actions: JSON.stringify(result.actions),
        durationMs: Date.now() - startedAt,
        finishedAt: new Date(),
      },
    })
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        summary: error instanceof Error ? error.message : 'Skill execution failed',
        durationMs: Date.now() - startedAt,
        finishedAt: new Date(),
      },
    })
    throw error
  }
}

export function serializeRun(run: {
  id: string
  skillId: string
  skillName: string
  status: string
  summary: string | null
  input: string | null
  steps: string
  findings: string
  actions: string
  durationMs: number | null
  createdAt: Date
  finishedAt: Date | null
}) {
  return {
    id: run.id,
    skillId: run.skillId,
    skillName: run.skillName,
    status: run.status,
    summary: run.summary,
    input: parseJson<Record<string, unknown>>(run.input, {}),
    steps: parseJson<RunStep[]>(run.steps, []),
    findings: parseJson<Finding[]>(run.findings, []),
    actions: parseJson<RunAction[]>(run.actions, []),
    durationMs: run.durationMs,
    createdAt: run.createdAt,
    finishedAt: run.finishedAt,
  }
}
