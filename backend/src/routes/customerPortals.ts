import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { auditService } from '../services/audit.service.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

// GET /api/customer-portals - List customer portals
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const { search, status } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view customer portals'
      });
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { metadata: { contains: search } },
      ];
    }

    const portals = await prisma.customerPortal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            // Add relations if needed in future
          }
        }
      }
    });

    res.json(portals);
  } catch (error: any) {
    console.error('[CustomerPortals] Error fetching portals:', error);
    res.status(500).json({
      error: 'Failed to fetch customer portals',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/customer-portals/:id - Get portal details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const portal = await prisma.customerPortal.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!portal) {
      return res.status(404).json({
        error: 'Customer portal not found',
        message: 'Portal does not exist or you do not have access to it'
      });
    }

    res.json(portal);
  } catch (error: any) {
    console.error('[CustomerPortals] Error fetching portal:', error);
    res.status(500).json({
      error: 'Failed to fetch customer portal',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/customer-portals - Create portal
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const {
      name,
      url,
      customerName,
      description,
      status,
      accessUrl,
      credentials,
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create customer portals'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name is required'
      });
    }

    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Tenant is required'
      });
    }

    const portal = await prisma.customerPortal.create({
      data: {
        name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        publicKey: `pk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        tenantId,
        // Store additional data in metadata
        metadata: JSON.stringify({
          url,
          customerName,
          description,
          status,
          accessUrl,
          credentials,
        }),
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'CustomerPortal',
      resourceId: portal.id,
      metadata: { name: portal.name, url, customerName },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(portal);
  } catch (error: any) {
    console.error('[CustomerPortals] Error creating portal:', error);
    res.status(500).json({
      error: 'Failed to create customer portal',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/customer-portals/:id - Update portal
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const {
      name,
      url,
      customerName,
      description,
      status,
      accessUrl,
      credentials,
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update customer portals'
      });
    }

    const existingPortal = await prisma.customerPortal.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingPortal) {
      return res.status(404).json({
        error: 'Customer portal not found',
        message: 'Portal does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    // Store additional data in metadata
    if (url !== undefined || customerName !== undefined || description !== undefined || 
        status !== undefined || accessUrl !== undefined || credentials !== undefined) {
      const existingMeta = existingPortal.metadata ? JSON.parse(existingPortal.metadata) : {};
      updateData.metadata = JSON.stringify({
        url: url !== undefined ? url : existingMeta.url,
        customerName: customerName !== undefined ? customerName : existingMeta.customerName,
        description: description !== undefined ? description : existingMeta.description,
        status: status !== undefined ? status : existingMeta.status,
        accessUrl: accessUrl !== undefined ? accessUrl : existingMeta.accessUrl,
        credentials: credentials !== undefined ? credentials : existingMeta.credentials,
      });
    }

    const updatedPortal = await prisma.customerPortal.update({
      where: { id },
      data: updateData
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'CustomerPortal',
      resourceId: updatedPortal.id,
      metadata: { changes: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedPortal);
  } catch (error: any) {
    console.error('[CustomerPortals] Error updating portal:', error);
    res.status(500).json({
      error: 'Failed to update customer portal',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/customer-portals/:id - Delete portal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete customer portals'
      });
    }

    const portal = await prisma.customerPortal.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!portal) {
      return res.status(404).json({
        error: 'Customer portal not found',
        message: 'Portal does not exist or you do not have access to it'
      });
    }

    await prisma.customerPortal.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'CustomerPortal',
      resourceId: id,
      metadata: { name: portal.name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[CustomerPortals] Error deleting portal:', error);
    res.status(500).json({
      error: 'Failed to delete customer portal',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

