import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware } from '../middleware/tenant.middleware.js'

const router = Router()

// Apply tenant middleware to all routes
router.use(tenantMiddleware)

/**
 * Get analytics data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    
    // Build where clause based on tenant
    let whereClause: any = {}
    if (req.tenant) {
      whereClause.tenantId = req.tenant.id
    } else if (isDevMode) {
      // In dev mode without tenant, get all documents
      whereClause.tenantId = null
    } else {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    // Get total counts
    const totalDocuments = await prisma.document.count({ where: whereClause })
    const totalUsers = await prisma.user.count()
    const totalTemplates = await prisma.template.count({
      where: req.tenant ? {
        OR: [{ tenantId: req.tenant.id }, { isGlobal: true }]
      } : { isGlobal: true }
    })

    // Get documents by category
    const documentsByCategory = await prisma.document.groupBy({
      by: ['category'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get documents by status
    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get document growth over last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const documents = await prisma.document.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
    const documentGrowthData: { month: string; documents: number; users: number }[] = []
    const userSet = new Set<string>()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth()
      const year = date.getFullYear()
      
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
      
      const monthDocuments = documents.filter(doc => {
        const docDate = new Date(doc.createdAt)
        return docDate >= monthStart && docDate <= monthEnd
      })
      
      monthDocuments.forEach(doc => userSet.add(doc.userId))
      
      documentGrowthData.push({
        month: monthNames[month],
        documents: monthDocuments.length,
        users: userSet.size
      })
    }

    // Get activity by hour (based on document updates)
    const activityByHourData: { hour: string; activity: number }[] = []
    const hourLabels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    
    for (const hourLabel of hourLabels) {
      const [hour] = hourLabel.split(':').map(Number)
      
      const hourStart = new Date()
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date()
      hourEnd.setHours(hour + 2, 59, 59, 999)
      
      // Count documents updated in this hour range (sample recent documents)
      const recentDocs = await prisma.document.count({
        where: {
          ...whereClause,
          updatedAt: {
            gte: hourStart,
            lte: hourEnd
          }
        }
      })
      
      activityByHourData.push({
        hour: hourLabel,
        activity: recentDocs
      })
    }

    // Calculate growth rate (current month vs last month)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    
    const currentMonthDocs = await prisma.document.count({
      where: {
        ...whereClause,
        createdAt: { gte: currentMonthStart }
      }
    })
    
    const lastMonthDocs = await prisma.document.count({
      where: {
        ...whereClause,
        createdAt: { 
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    })
    
    const growthRate = lastMonthDocs > 0 
      ? ((currentMonthDocs - lastMonthDocs) / lastMonthDocs) * 100 
      : currentMonthDocs > 0 ? 100 : 0

    // Calculate documents per user
    const documentsPerUser = totalUsers > 0 ? (totalDocuments / totalUsers).toFixed(1) : '0.0'

    // Get peak hour
    const peakHourData = activityByHourData.reduce((max, item) => 
      item.activity > max.activity ? item : max, 
      activityByHourData[0] || { hour: '09:00', activity: 0 }
    )

    // Format category data for charts
    const categoryData = documentsByCategory.map((item, index) => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
      return {
        name: item.category || 'Unknown',
        value: item._count.id,
        color: colors[index % colors.length]
      }
    })

    // Get user engagement (last 4 weeks)
    const userEngagementData: { week: string; active: number; new: number }[] = []
    const weeksAgo = 4
    
    for (let i = weeksAgo - 1; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7) - 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - (i * 7))
      
      // Count active users (who created/updated documents)
      const activeUsers = await prisma.document.findMany({
        where: {
          ...whereClause,
          OR: [
            { createdAt: { gte: weekStart, lte: weekEnd } },
            { updatedAt: { gte: weekStart, lte: weekEnd } }
          ]
        },
        select: { userId: true },
        distinct: ['userId']
      })
      
      // Count new users
      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })
      
      userEngagementData.push({
        week: `Week ${weeksAgo - i}`,
        active: activeUsers.length,
        new: newUsers
      })
    }

    res.json({
      stats: {
        totalDocuments,
        totalUsers,
        totalTemplates,
        growthRate: Math.round(growthRate * 10) / 10,
        documentsPerUser: parseFloat(documentsPerUser),
        peakHour: peakHourData.hour,
        avgResponseTime: 2.4 // Placeholder - can be calculated from chat logs if available
      },
      charts: {
        documentGrowth: documentGrowthData,
        categoryDistribution: categoryData,
        activityByHour: activityByHourData,
        userEngagement: userEngagementData,
        documentsByStatus: documentsByStatus.map(item => ({
          name: item.status || 'Unknown',
          value: item._count.id
        }))
      }
    })
  } catch (error: any) {
    console.error('[Analytics] Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

export default router

