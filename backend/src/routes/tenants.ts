import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { tenantMiddleware, requireTenantRole } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/tenants
 * Get all tenants for current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApplicationError('User not authenticated', 401);
    }

    const tenants = await prisma.tenantMember.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        tenant: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    res.json(
      tenants.map((tm) => ({
        id: tm.tenant.id,
        name: tm.tenant.name,
        slug: tm.tenant.slug,
        description: tm.tenant.description,
        role: tm.role,
        subscriptionStatus: tm.tenant.subscriptionStatus,
        subscriptionPlan: tm.tenant.subscriptionPlan,
        isActive: tm.tenant.isActive,
        joinedAt: tm.joinedAt,
      }))
    );
  } catch (error) {
    console.error('[Tenants] Error fetching user tenants:', error);
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Failed to fetch tenants', 500);
  }
});

/**
 * GET /api/tenants/:id
 * Get single tenant details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApplicationError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if user is member of tenant
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: id,
          userId: req.user.id,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new ApplicationError('Tenant not found or access denied', 404);
    }

    res.json({
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      description: membership.tenant.description,
      role: membership.role,
      subscriptionStatus: membership.tenant.subscriptionStatus,
      subscriptionPlan: membership.tenant.subscriptionPlan,
      isActive: membership.tenant.isActive,
      createdAt: membership.tenant.createdAt,
      joinedAt: membership.joinedAt,
    });
  } catch (error) {
    console.error('[Tenants] Error fetching tenant:', error);
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Failed to fetch tenant', 500);
  }
});

/**
 * POST /api/tenants
 * Create new tenant
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApplicationError('User not authenticated', 401);
    }

    const { name, slug, description } = req.body;

    if (!name || !slug) {
      throw new ApplicationError('Name and slug are required', 400);
    }

    // Validate slug format (URL-friendly)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      throw new ApplicationError(
        'Slug must be lowercase alphanumeric with hyphens only',
        400
      );
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ApplicationError('Tenant slug already exists', 409);
    }

    // Create tenant and add creator as owner
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    res.status(201).json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      role: 'OWNER',
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.subscriptionPlan,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
    });
  } catch (error) {
    console.error('[Tenants] Error creating tenant:', error);
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Failed to create tenant', 500);
  }
});

/**
 * PATCH /api/tenants/:id
 * Update tenant (only OWNER/ADMIN)
 */
router.patch('/:id', authenticate, tenantMiddleware, requireTenantRole('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.tenant || !req.user) {
      throw new ApplicationError('Tenant and user context required', 400);
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Verify tenant ID matches
    if (id !== req.tenant.id) {
      throw new ApplicationError('Tenant ID mismatch', 400);
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.subscriptionPlan,
      isActive: tenant.isActive,
      updatedAt: tenant.updatedAt,
    });
  } catch (error) {
    console.error('[Tenants] Error updating tenant:', error);
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Failed to update tenant', 500);
  }
});

export default router;

