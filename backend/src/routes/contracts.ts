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

// GET /api/contracts - List contracts
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const { type, vendor, expiring } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view contracts'
      });
    }

    if (type && typeof type === 'string') {
      where.type = type;
    }
    if (vendor && typeof vendor === 'string') {
      where.vendor = { contains: vendor, mode: 'insensitive' };
    }

    // Filter for expiring contracts (within notifyDays)
    if (expiring === 'true') {
      const notifyDays = 30; // Default
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + notifyDays);
      where.endDate = {
        lte: expiryDate,
        gte: new Date(), // Not already expired
      };
    }

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json(contracts);
  } catch (error: any) {
    console.error('[Contracts] Error fetching contracts:', error);
    res.status(500).json({
      error: 'Failed to fetch contracts',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/contracts/expiring - Get expiring contracts (notification)
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const notifyDays = req.query.days ? parseInt(req.query.days as string) : 30;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view expiring contracts'
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + notifyDays);

    where.endDate = {
      lte: expiryDate,
      gte: new Date(), // Not already expired
    };

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json(contracts);
  } catch (error: any) {
    console.error('[Contracts] Error fetching expiring contracts:', error);
    res.status(500).json({
      error: 'Failed to fetch expiring contracts',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/contracts/:id - Get contract details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        asset: {
          include: {
            networkDevices: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        message: 'Contract does not exist or you do not have access to it'
      });
    }

    res.json(contract);
  } catch (error: any) {
    console.error('[Contracts] Error fetching contract:', error);
    res.status(500).json({
      error: 'Failed to fetch contract',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/contracts - Create contract
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const {
      name,
      type,
      vendor,
      contractNumber,
      startDate,
      endDate,
      renewalDate,
      autoRenew,
      monthlyCost,
      annualCost,
      currency,
      assetId,
      notifyDays,
      notes,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create contracts'
      });
    }

    if (!name || !type) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and type are required'
      });
    }

    const tenantId = req.tenant?.id || null;

    const contract = await prisma.contract.create({
      data: {
        name,
        type,
        vendor: vendor || null,
        contractNumber: contractNumber || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        autoRenew: autoRenew || false,
        monthlyCost: monthlyCost ? parseFloat(monthlyCost) : null,
        annualCost: annualCost ? parseFloat(annualCost) : null,
        currency: currency || 'EUR',
        assetId: assetId || null,
        notifyDays: notifyDays || 30,
        notes: notes || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        tenantId,
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'CREATE',
      resource: 'Contract',
      resourceId: contract.id,
      metadata: { name: contract.name, type: contract.type },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(contract);
  } catch (error: any) {
    console.error('[Contracts] Error creating contract:', error);
    res.status(500).json({
      error: 'Failed to create contract',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const {
      name,
      type,
      vendor,
      contractNumber,
      startDate,
      endDate,
      renewalDate,
      autoRenew,
      monthlyCost,
      annualCost,
      currency,
      assetId,
      notifyDays,
      notes,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update contracts'
      });
    }

    const existingContract = await prisma.contract.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingContract) {
      return res.status(404).json({
        error: 'Contract not found',
        message: 'Contract does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (vendor !== undefined) updateData.vendor = vendor;
    if (contractNumber !== undefined) updateData.contractNumber = contractNumber;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (renewalDate !== undefined) updateData.renewalDate = renewalDate ? new Date(renewalDate) : null;
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
    if (monthlyCost !== undefined) updateData.monthlyCost = monthlyCost ? parseFloat(monthlyCost) : null;
    if (annualCost !== undefined) updateData.annualCost = annualCost ? parseFloat(annualCost) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (assetId !== undefined) updateData.assetId = assetId;
    if (notifyDays !== undefined) updateData.notifyDays = notifyDays;
    if (notes !== undefined) updateData.notes = notes;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: updateData
    });

    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'Contract',
      resourceId: updatedContract.id,
      metadata: { changes: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedContract);
  } catch (error: any) {
    console.error('[Contracts] Error updating contract:', error);
    res.status(500).json({
      error: 'Failed to update contract',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/contracts/:id/renew - Renew contract
router.post('/:id/renew', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endDate, renewalDate } = req.body;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to renew contracts'
      });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        message: 'Contract does not exist or you do not have access to it'
      });
    }

    // Calculate new dates (typically 1 year extension)
    const newEndDate = endDate ? new Date(endDate) : new Date(contract.endDate || new Date());
    if (!endDate && contract.endDate) {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    const newRenewalDate = renewalDate ? new Date(renewalDate) : new Date(newEndDate);
    if (!renewalDate) {
      newRenewalDate.setDate(newRenewalDate.getDate() - (contract.notifyDays || 30));
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        endDate: newEndDate,
        renewalDate: newRenewalDate,
        updatedAt: new Date(),
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'RENEW',
      resource: 'Contract',
      resourceId: updatedContract.id,
      metadata: { newEndDate, newRenewalDate },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedContract);
  } catch (error: any) {
    console.error('[Contracts] Error renewing contract:', error);
    res.status(500).json({
      error: 'Failed to renew contract',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete contracts'
      });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        message: 'Contract does not exist or you do not have access to it'
      });
    }

    await prisma.contract.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'Contract',
      resourceId: id,
      metadata: { name: contract.name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Contracts] Error deleting contract:', error);
    res.status(500).json({
      error: 'Failed to delete contract',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

