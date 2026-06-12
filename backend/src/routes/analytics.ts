import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware } from '../middleware/tenant.middleware.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { devAuthenticate } from '../middleware/auth.dev.middleware.js'

const router = Router()

const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true'
router.use(isDevMode ? devAuthenticate : authenticate)
router.use(tenantMiddleware)

const STALE_DAYS = 180

// GET /api/analytics - Documentation workspace overview
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id ?? null

    if (!tenantId && !isDevMode) {
      return res.status(400).json({
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant',
      })
    }

    const docWhere = tenantId ? { tenantId } : {}
    const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

    const [documents, totalTemplates, totalAssets, openFindings, lastRun, appliedFindings] = await Promise.all([
      prisma.document.findMany({
        where: docWhere,
        select: { status: true, category: true, updatedAt: true },
      }),
      prisma.template.count({
        where: tenantId ? { OR: [{ tenantId }, { isGlobal: true }] } : {},
      }),
      prisma.asset.count({ where: tenantId ? { tenantId } : {} }),
      prisma.agentFinding.findMany({
        where: { status: 'OPEN', ...(tenantId ? { tenantId } : {}) },
        select: { severity: true },
      }),
      prisma.agentRun.findFirst({
        where: tenantId ? { tenantId } : {},
        orderBy: { startedAt: 'desc' },
        select: { skill: true, status: true, startedAt: true, finishedAt: true },
      }),
      prisma.agentFinding.count({
        where: { status: 'APPLIED', ...(tenantId ? { tenantId } : {}) },
      }),
    ])

    const byStatus = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.status] = (acc[doc.status] ?? 0) + 1
      return acc
    }, {})

    const byCategory = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.category] = (acc[doc.category] ?? 0) + 1
      return acc
    }, {})

    const staleDocuments = documents.filter((d) => d.status !== 'ARCHIVED' && d.updatedAt < staleCutoff).length

    const findingsBySeverity = openFindings.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1
      return acc
    }, {})

    // Simple health score: start at 100, deduct per open finding weighted by severity
    const weights: Record<string, number> = { LOW: 1, MEDIUM: 3, HIGH: 6, CRITICAL: 10 }
    const penalty = openFindings.reduce((sum, f) => sum + (weights[f.severity] ?? 3), 0)
    const healthScore = documents.length === 0 ? 100 : Math.max(0, Math.round(100 - (penalty / Math.max(documents.length, 1)) * 4))

    res.json({
      documents: {
        total: documents.length,
        byStatus,
        byCategory,
        stale: staleDocuments,
        published: byStatus['PUBLISHED'] ?? 0,
        drafts: byStatus['DRAFT'] ?? 0,
        inReview: byStatus['REVIEW'] ?? 0,
      },
      templates: { total: totalTemplates },
      assets: { total: totalAssets },
      agent: {
        openFindings: openFindings.length,
        findingsBySeverity,
        appliedFindings,
        healthScore,
        lastRun,
      },
    })
  } catch (error: any) {
    console.error('[Analytics] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message || 'An unexpected error occurred',
    })
  }
})

export default router
