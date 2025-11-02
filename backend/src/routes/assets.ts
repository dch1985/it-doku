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

// GET /api/assets/types - Get asset types
router.get('/types', async (req: Request, res: Response) => {
  const assetTypes = [
    'SERVER',
    'SWITCH',
    'ROUTER',
    'FIREWALL',
    'PRINTER',
    'WORKSTATION',
    'LAPTOP',
    'MOBILE',
    'ACCESS_POINT',
    'STORAGE',
    'UPS',
    'MONITOR',
    'OTHER'
  ];
  res.json(assetTypes);
});

// GET /api/assets - List assets with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const { type, status, location, search } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view assets'
      });
    }

    if (type && typeof type === 'string') {
      where.type = type;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (location && typeof location === 'string') {
      where.location = location;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { hostname: { contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        contracts: {
          select: {
            id: true,
            name: true,
            type: true,
            endDate: true,
          },
          orderBy: { endDate: 'asc' }
        },
        passwords: {
          select: {
            id: true,
            name: true,
            username: true,
            url: true,
          }
        },
        _count: {
          select: {
            contracts: true,
            networkDevices: true,
            passwords: true,
          }
        }
      }
    });

    res.json(assets);
  } catch (error: any) {
    console.error('[Assets] Error fetching assets:', error);
    res.status(500).json({
      error: 'Failed to fetch assets',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/assets/:id - Get asset details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        contracts: {
          orderBy: { endDate: 'asc' }
        },
        passwords: {
          select: {
            id: true,
            name: true,
            username: true,
            url: true,
            expiresAt: true,
          },
          orderBy: { updatedAt: 'desc' }
        },
        networkDevices: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            deviceType: true,
            isActive: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'Asset does not exist or you do not have access to it'
      });
    }

    res.json(asset);
  } catch (error: any) {
    console.error('[Assets] Error fetching asset:', error);
    res.status(500).json({
      error: 'Failed to fetch asset',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/assets/:id/contracts - Get contracts for asset
router.get('/:id/contracts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'Asset does not exist or you do not have access to it'
      });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        assetId: id
      },
      orderBy: { endDate: 'asc' }
    });

    res.json(contracts);
  } catch (error: any) {
    console.error('[Assets] Error fetching asset contracts:', error);
    res.status(500).json({
      error: 'Failed to fetch contracts',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/assets - Create asset
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const {
      name,
      type,
      manufacturer,
      model,
      serialNumber,
      assetTag,
      ipAddress,
      macAddress,
      hostname,
      location,
      rack,
      rackPosition,
      status,
      purchaseDate,
      warrantyExp,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create assets'
      });
    }

    if (!name || !type) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and type are required'
      });
    }

    const tenantId = req.tenant?.id || null;

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        manufacturer: manufacturer || null,
        model: model || null,
        serialNumber: serialNumber || null,
        assetTag: assetTag || null,
        ipAddress: ipAddress || null,
        macAddress: macAddress || null,
        hostname: hostname || null,
        location: location || null,
        rack: rack || null,
        rackPosition: rackPosition || null,
        status: status || 'ACTIVE',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExp: warrantyExp ? new Date(warrantyExp) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        tenantId,
        userId: req.user.id || null,
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Asset',
      resourceId: asset.id,
      metadata: { name: asset.name, type: asset.type },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(asset);
  } catch (error: any) {
    console.error('[Assets] Error creating asset:', error);
    res.status(500).json({
      error: 'Failed to create asset',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/assets/:id - Update asset
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const {
      name,
      type,
      manufacturer,
      model,
      serialNumber,
      assetTag,
      ipAddress,
      macAddress,
      hostname,
      location,
      rack,
      rackPosition,
      status,
      purchaseDate,
      warrantyExp,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update assets'
      });
    }

    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingAsset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'Asset does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (model !== undefined) updateData.model = model;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (assetTag !== undefined) updateData.assetTag = assetTag;
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress;
    if (macAddress !== undefined) updateData.macAddress = macAddress;
    if (hostname !== undefined) updateData.hostname = hostname;
    if (location !== undefined) updateData.location = location;
    if (rack !== undefined) updateData.rack = rack;
    if (rackPosition !== undefined) updateData.rackPosition = rackPosition;
    if (status !== undefined) updateData.status = status;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (warrantyExp !== undefined) updateData.warrantyExp = warrantyExp ? new Date(warrantyExp) : null;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Asset',
      resourceId: updatedAsset.id,
      metadata: { changes: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedAsset);
  } catch (error: any) {
    console.error('[Assets] Error updating asset:', error);
    res.status(500).json({
      error: 'Failed to update asset',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete assets'
      });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'Asset does not exist or you do not have access to it'
      });
    }

    await prisma.asset.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'Asset',
      resourceId: id,
      metadata: { name: asset.name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Assets] Error deleting asset:', error);
    res.status(500).json({
      error: 'Failed to delete asset',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

