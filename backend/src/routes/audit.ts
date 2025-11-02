import { Router, Request, Response } from 'express';
import { auditService } from '../services/audit.service.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

// GET /api/audit - Get audit logs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { action, resource, resourceId, limit, offset } = req.query;

    const logs = await auditService.getLogs({
      userId: req.user?.id,
      action: action as string,
      resource: resource as string,
      resourceId: resourceId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] Error fetching logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/audit/recent - Get recent activity
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const logs = await auditService.getRecentActivity(limit ? parseInt(limit as string) : 50);
    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] Error fetching recent activity:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/audit/resource/:resource/:resourceId - Get logs for a specific resource
router.get('/resource/:resource/:resourceId', async (req: Request, res: Response) => {
  try {
    const { resource, resourceId } = req.params;
    const { limit } = req.query;

    const logs = await auditService.getResourceLogs(
      resource,
      resourceId,
      limit ? parseInt(limit as string) : 50
    );

    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] Error fetching resource logs:', error);
    res.status(500).json({
      error: 'Failed to fetch resource logs',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/audit/user/:userId - Get logs for a specific user (Admin only)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { userId } = req.params;
    const { limit } = req.query;

    const logs = await auditService.getUserLogs(
      userId,
      limit ? parseInt(limit as string) : 100
    );

    res.json(logs);
  } catch (error: any) {
    console.error('[Audit] Error fetching user logs:', error);
    res.status(500).json({
      error: 'Failed to fetch user logs',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/audit/stats - Get activity statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { timeframe } = req.query;
    const stats = await auditService.getStats(
      (timeframe as 'day' | 'week' | 'month') || 'week'
    );
    res.json(stats);
  } catch (error: any) {
    console.error('[Audit] Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch audit stats',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

