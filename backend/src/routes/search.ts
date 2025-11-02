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

// GET /api/search - Global search across all entities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Query parameter "q" is required'
      });
    }

    const searchQuery = q.trim();
    if (searchQuery.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Query cannot be empty'
      });
    }

    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const results: any = {
      documents: [],
      assets: [],
      passwords: [],
      contracts: [],
      networkDevices: [],
      total: 0,
    };

    // Search documents
    if (!type || type === 'documents') {
      const whereDocument: any = {};
      if (tenantId) {
        whereDocument.tenantId = tenantId;
      }
      
      const documents = await prisma.document.findMany({
        where: {
          ...whereDocument,
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
            { category: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { updatedAt: 'desc' },
      });
      results.documents = documents;
      results.total += documents.length;
    }

    // Search assets
    if (!type || type === 'assets') {
      const whereAsset: any = {};
      if (tenantId) {
        whereAsset.tenantId = tenantId;
      }

      const assets = await prisma.asset.findMany({
        where: {
          ...whereAsset,
          OR: [
            { name: { contains: searchQuery } },
            { type: { contains: searchQuery } },
            { hostname: { contains: searchQuery } },
            { assetTag: { contains: searchQuery } },
            { serialNumber: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          location: true,
          updatedAt: true,
        },
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { updatedAt: 'desc' },
      });
      results.assets = assets;
      results.total += assets.length;
    }

    // Search passwords
    if (!type || type === 'passwords') {
      const wherePassword: any = {};
      if (tenantId) {
        wherePassword.tenantId = tenantId;
      }

      const passwords = await prisma.password.findMany({
        where: {
          ...wherePassword,
          OR: [
            { name: { contains: searchQuery } },
            { username: { contains: searchQuery } },
            { url: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          url: true,
          updatedAt: true,
        },
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { updatedAt: 'desc' },
      });
      results.passwords = passwords;
      results.total += passwords.length;
    }

    // Search contracts
    if (!type || type === 'contracts') {
      const whereContract: any = {};
      if (tenantId) {
        whereContract.tenantId = tenantId;
      }

      const contracts = await prisma.contract.findMany({
        where: {
          ...whereContract,
          OR: [
            { name: { contains: searchQuery } },
            { type: { contains: searchQuery } },
            { vendor: { contains: searchQuery } },
            { contractNumber: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          vendor: true,
          contractNumber: true,
          endDate: true,
          updatedAt: true,
        },
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { updatedAt: 'desc' },
      });
      results.contracts = contracts;
      results.total += contracts.length;
    }

    // Search network devices
    if (!type || type === 'networkDevices') {
      const whereDevice: any = {};
      if (tenantId) {
        whereDevice.tenantId = tenantId;
      }

      const networkDevices = await prisma.networkDevice.findMany({
        where: {
          ...whereDevice,
          OR: [
            { name: { contains: searchQuery } },
            { ipAddress: { contains: searchQuery } },
            { hostname: { contains: searchQuery } },
            { deviceType: { contains: searchQuery } },
          ],
        },
        select: {
          id: true,
          name: true,
          ipAddress: true,
          deviceType: true,
          isActive: true,
          updatedAt: true,
        },
        take: limit ? parseInt(limit as string) : 20,
        orderBy: { updatedAt: 'desc' },
      });
      results.networkDevices = networkDevices;
      results.total += networkDevices.length;
    }

    res.json(results);
  } catch (error: any) {
    console.error('[Search] Error:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

