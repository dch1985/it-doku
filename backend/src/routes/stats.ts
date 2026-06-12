import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import {
  COVERAGE_REQUIREMENTS,
  CRITICAL_EXTRA_CATEGORY,
  DocumentCategory,
  REVIEW_INTERVAL_DAYS,
  REQUIRED_SECTIONS,
} from '../agent/knowledge.js'
import { serializeRun } from '../agent/skills.js'

const router = Router()

/** Aggregated dashboard stats: library counts, coverage and freshness. */
router.get('/', async (_req: Request, res: Response) => {
  const [documents, assets, lastRun] = await Promise.all([
    prisma.document.findMany({
      select: { id: true, category: true, status: true, updatedAt: true, reviewedAt: true },
    }),
    prisma.asset.findMany({
      where: { status: { not: 'RETIRED' } },
      select: {
        id: true,
        criticality: true,
        type: true,
        documents: { select: { category: true, status: true } },
      },
    }),
    prisma.agentRun.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  const byStatus: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  let stale = 0
  const now = Date.now()

  for (const doc of documents) {
    byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1
    byCategory[doc.category] = (byCategory[doc.category] ?? 0) + 1
    if (doc.status !== 'ARCHIVED') {
      const category = (REQUIRED_SECTIONS as Record<string, unknown>)[doc.category]
        ? (doc.category as DocumentCategory)
        : 'GENERAL'
      const reference = doc.reviewedAt ?? doc.updatedAt
      const ageDays = Math.floor((now - reference.getTime()) / 86_400_000)
      if (ageDays > REVIEW_INTERVAL_DAYS[category]) stale += 1
    }
  }

  let requiredTotal = 0
  let coveredTotal = 0
  for (const asset of assets) {
    const type = (COVERAGE_REQUIREMENTS as Record<string, DocumentCategory[]>)[asset.type] ?? COVERAGE_REQUIREMENTS.SERVER
    const required = new Set<DocumentCategory>(type)
    if (asset.criticality === 'CRITICAL') required.add(CRITICAL_EXTRA_CATEGORY)
    const present = new Set(asset.documents.filter((d) => d.status !== 'ARCHIVED').map((d) => d.category))
    for (const category of required) {
      requiredTotal += 1
      if (present.has(category)) coveredTotal += 1
    }
  }

  res.json({
    documents: { total: documents.length, byStatus, byCategory, stale },
    assets: { total: assets.length },
    coverage: {
      required: requiredTotal,
      covered: coveredTotal,
      percent: requiredTotal === 0 ? 100 : Math.round((coveredTotal / requiredTotal) * 100),
    },
    lastAgentRun: lastRun ? serializeRun(lastRun) : null,
  })
})

export default router
