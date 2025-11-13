import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware } from '../middleware/tenant.middleware.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { devAuthenticate } from '../middleware/auth.dev.middleware.js'

const router = Router()

const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true'
router.use(isDevMode ? devAuthenticate : authenticate)
router.use(tenantMiddleware)

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id ?? null

    if (!tenantId && !isDevMode) {
      return res.status(400).json({
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const documentFilter = tenantId ? { tenantId } : { tenantId: null }
    const documentFilterWithGlobal = tenantId
      ? {
          OR: [
            { tenantId },
            { tenantId: null }
          ]
        }
      : documentFilter

    const automationFilter = tenantId ? { tenantId } : {}

    const since7Days = new Date()
    since7Days.setDate(since7Days.getDate() - 7)

    const since30Days = new Date()
    since30Days.setDate(since30Days.getDate() - 30)

    // Dokumente für spätere Filter (IDs + Count)
    const documentsForTenant = await prisma.document.findMany({
      where: documentFilter,
      select: { id: true },
    })
    const documentIds = documentsForTenant.map((doc) => doc.id)
    const totalDocuments = documentIds.length

    // --- System baseline ---
    const [totalTemplates, totalUsers] = await Promise.all([
      prisma.template.count({
        where: tenantId
          ? {
              OR: [
                { tenantId },
                { isGlobal: true }
              ]
            }
          : { isGlobal: true }
      }),
      prisma.user.count(),
    ])

    // --- Automate metrics ---
    const [jobsStarted, jobsCompleted, jobsFailed, suggestionsApplied, suggestionsDismissed, automationFindingsOpen] = await Promise.all([
      prisma.generationJob.count({
        where: {
          ...automationFilter,
          createdAt: { gte: since7Days },
        },
      }),
      prisma.generationJob.count({
        where: {
          ...automationFilter,
          status: 'COMPLETED',
          createdAt: { gte: since7Days },
        },
      }),
      prisma.generationJob.count({
        where: {
          ...automationFilter,
          status: 'FAILED',
          createdAt: { gte: since7Days },
        },
      }),
      prisma.updateSuggestion.count({
        where: {
          status: 'APPLIED',
          generationJob: automationFilter,
        },
      }),
      prisma.updateSuggestion.count({
        where: {
          status: 'DISMISSED',
          generationJob: automationFilter,
        },
      }),
      prisma.qualityFinding.count({
        where: {
          generationJob: automationFilter,
          resolvedAt: null,
        },
      }),
    ])

    const connectors = await prisma.sourceConnector.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    const connectorIds = connectors.map((c) => c.id)
    const recentConnectorJobs = connectorIds.length
      ? await prisma.generationJob.findMany({
          where: { sourceConnectorId: { in: connectorIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            sourceConnectorId: true,
          },
          take: connectorIds.length * 3,
        })
      : []

    const connectorStatus = connectors.map((connector) => {
      const lastJob = recentConnectorJobs.find((job) => job.sourceConnectorId === connector.id)

      let status: 'OK' | 'DEGRADED' | 'OFFLINE' = 'OK'
      if (!connector.isActive) {
        status = 'OFFLINE'
      } else if (!lastJob) {
        status = 'DEGRADED'
      } else {
        const ageMs = Date.now() - lastJob.createdAt.getTime()
        const olderThan24h = ageMs > 1000 * 60 * 60 * 24
        status = olderThan24h || lastJob.status === 'FAILED' ? 'DEGRADED' : 'OK'
      }

      return {
        id: connector.id,
        name: connector.name,
        type: connector.type,
        isActive: connector.isActive,
        status,
        lastJob,
      }
    })

    const automationMetrics = {
      jobs: {
        started: jobsStarted,
        completed: jobsCompleted,
        failed: jobsFailed,
        completionRate: jobsStarted > 0 ? Math.round((jobsCompleted / jobsStarted) * 1000) / 10 : 0,
      },
      suggestions: {
        applied: suggestionsApplied,
        dismissed: suggestionsDismissed,
        estimatedTimeSavedHours: Math.round((suggestionsApplied * 20) / 60), // 20min pro Vorschlag
      },
      findingsOpen: automationFindingsOpen,
      connectors: connectorStatus,
    }

    // --- Centralize metrics ---
    const [assistantTraces, knowledgeSummary, docsWithKnowledge, knowledgeWithoutDocument] = await Promise.all([
      prisma.conversationTrace.groupBy({
        by: ['audience'],
        where: {
          tenantId,
          createdAt: { gte: since7Days },
        },
        _count: { id: true },
      }),
      prisma.knowledgeNode.groupBy({
        by: ['type'],
        where: tenantId ? { document: { tenantId } } : {},
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.document.count({
        where: {
          ...documentFilter,
          knowledgeNodes: { some: {} },
        },
      }),
      prisma.knowledgeNode.count({
        where: { documentId: null },
      }),
    ])

    const assistantTotal = assistantTraces.reduce((sum, item) => sum + ((item._count as any)?.id ?? 0), 0)

    const centralizeMetrics = {
      assistant: {
        totalQueries: assistantTotal,
        byAudience: assistantTraces.map((item) => ({
          audience: item.audience ?? 'PRACTITIONER',
          count: (item._count as any)?.id ?? 0,
        })),
      },
      knowledge: {
        documentsWithCoverage: docsWithKnowledge,
        documentsWithoutCoverage: Math.max(totalDocuments - docsWithKnowledge, 0),
        nodesWithoutDocument: knowledgeWithoutDocument,
        topTypes: knowledgeSummary.map((item) => ({
          type: item.type ?? 'UNKNOWN',
          count: (item._count as any)?.id ?? 0,
        })),
      },
    }

    // --- Comply metrics ---
    let openFindings: Array<{ severity: string | null; count: number }> = []
    let resolvedFindings: Array<{ createdAt: Date; resolvedAt: Date | null }> = []

    if (documentIds.length > 0) {
      const openFindingRows = await prisma.qualityFinding.findMany({
        where: {
          documentId: { in: documentIds },
          resolvedAt: null,
        },
        select: {
          severity: true,
        },
      })

      const grouped = openFindingRows.reduce<Record<string, number>>((acc, finding) => {
        const key = finding.severity ?? 'INFO'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
      openFindings = Object.entries(grouped).map(([severity, count]) => ({ severity, count }))

      resolvedFindings = await prisma.qualityFinding.findMany({
        where: {
          documentId: { in: documentIds },
          resolvedAt: { not: null },
          createdAt: { gte: since30Days },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      })
    }

    const [reviewStats, openReviewRequests, reqIdAnnotations] = await Promise.all([
      prisma.reviewRequest.findMany({
        where: {
          documentId: documentIds.length > 0 ? { in: documentIds } : undefined,
          status: 'APPROVED',
          reviewedAt: { not: null },
          createdAt: { gte: since30Days },
        },
        select: {
          createdAt: true,
          reviewedAt: true,
        },
      }),
      prisma.reviewRequest.count({
        where: {
          documentId: documentIds.length > 0 ? { in: documentIds } : undefined,
          status: { in: ['PENDING', 'CHANGES_REQUESTED'] },
        },
      }),
      documentIds.length > 0
        ? prisma.annotation.findMany({
            where: {
              documentId: { in: documentIds },
              key: 'REQ-ID',
            },
            select: {
              documentId: true,
            },
            distinct: ['documentId'],
          })
        : Promise.resolve([]),
    ])

    const avgFindingResolutionDays = resolvedFindings.length > 0
      ? Math.round((resolvedFindings.reduce((sum, finding) => {
          const resolvedAt = finding.resolvedAt ?? new Date()
          return sum + (resolvedAt.getTime() - finding.createdAt.getTime())
        }, 0) / resolvedFindings.length / (1000 * 60 * 60 * 24)) * 10) / 10
      : 0

    const avgReviewCycleDays = reviewStats.length > 0
      ? Math.round((reviewStats.reduce((sum, review) => {
          const reviewedAt = review.reviewedAt ?? new Date()
          return sum + (reviewedAt.getTime() - review.createdAt.getTime())
        }, 0) / reviewStats.length / (1000 * 60 * 60 * 24)) * 10) / 10
      : 0

    const reqIdCoverage = Array.isArray(reqIdAnnotations) ? reqIdAnnotations.length : 0

    const complyMetrics = {
      findings: {
        openBySeverity: openFindings.map((item) => ({
          severity: item.severity ?? 'INFO',
          count: item.count,
        })),
        avgResolutionDays: avgFindingResolutionDays,
      },
      reviews: {
        openRequests: openReviewRequests,
        avgCycleDays: avgReviewCycleDays,
      },
      policies: {
        reqIdCoveragePercent: totalDocuments > 0 ? Math.round((reqIdCoverage / totalDocuments) * 1000) / 10 : 0,
        documentsWithReqId: reqIdCoverage,
      },
    }

    res.json({
      system: {
        totalDocuments,
        totalTemplates,
        totalUsers,
      },
      automation: automationMetrics,
      centralize: centralizeMetrics,
      comply: complyMetrics,
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

