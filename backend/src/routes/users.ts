import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/users - Get users in current tenant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Tenant context required'
      });
    }

    // Get all users who are members of the current tenant
    const tenantMembers = await prisma.tenantMember.findMany({
      where: {
        tenantId: req.tenant.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    const users = tenantMembers.map((tm) => ({
      id: tm.user.id,
      name: tm.user.name,
      email: tm.user.email,
      role: tm.user.role,
      avatar: tm.user.avatar,
      tenantRole: tm.role,
    }));

    res.json(users);
  } catch (error: any) {
    console.error('[Users] Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

