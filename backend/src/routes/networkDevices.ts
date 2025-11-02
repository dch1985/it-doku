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

// GET /api/network-devices/types - Get device types
router.get('/types', async (req: Request, res: Response) => {
  const deviceTypes = [
    'SWITCH',
    'ROUTER',
    'FIREWALL',
    'SERVER',
    'PRINTER',
    'ACCESS_POINT',
    'MODEM',
    'HUB',
    'BRIDGE',
    'REPEATER',
    'OTHER'
  ];
  res.json(deviceTypes);
});

// GET /api/network-devices - List network devices
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const { deviceType, isActive, search, assetId } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view network devices'
      });
    }

    if (deviceType && typeof deviceType === 'string') {
      where.deviceType = deviceType;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (assetId && typeof assetId === 'string') {
      where.assetId = assetId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { ipAddress: { contains: search } },
        { hostname: { contains: search } },
        { macAddress: { contains: search } },
      ];
    }

    const devices = await prisma.networkDevice.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { lastSeen: 'desc' }
      ],
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        _count: {
          select: {
            // Add relations if needed in future
          }
        }
      }
    });

    res.json(devices);
  } catch (error: any) {
    console.error('[NetworkDevices] Error fetching devices:', error);
    res.status(500).json({
      error: 'Failed to fetch network devices',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/network-devices/:id - Get device details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const device = await prisma.networkDevice.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        asset: {
          include: {
            contracts: {
              select: {
                id: true,
                name: true,
                type: true,
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

    if (!device) {
      return res.status(404).json({
        error: 'Network device not found',
        message: 'Device does not exist or you do not have access to it'
      });
    }

    res.json(device);
  } catch (error: any) {
    console.error('[NetworkDevices] Error fetching device:', error);
    res.status(500).json({
      error: 'Failed to fetch network device',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/network-devices - Create or update network device (discovery)
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const {
      name,
      ipAddress,
      macAddress,
      hostname,
      deviceType,
      manufacturer,
      model,
      firmware,
      serialNumber,
      subnet,
      gateway,
      dnsServers,
      assetId,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create network devices'
      });
    }

    if (!name || !ipAddress || !deviceType) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, IP address, and device type are required'
      });
    }

    const tenantId = req.tenant?.id || null;

    // Check if device already exists (same IP in same tenant)
    const existingDevice = await prisma.networkDevice.findFirst({
      where: {
        ipAddress,
        ...(tenantId ? { tenantId } : { tenantId: null })
      }
    });

    if (existingDevice) {
      // Update existing device
      const updatedDevice = await prisma.networkDevice.update({
        where: { id: existingDevice.id },
        data: {
          name,
          macAddress: macAddress || existingDevice.macAddress,
          hostname: hostname || existingDevice.hostname,
          deviceType,
          manufacturer: manufacturer || existingDevice.manufacturer,
          model: model || existingDevice.model,
          firmware: firmware || existingDevice.firmware,
          serialNumber: serialNumber || existingDevice.serialNumber,
          subnet: subnet || existingDevice.subnet,
          gateway: gateway || existingDevice.gateway,
          dnsServers: dnsServers ? JSON.stringify(dnsServers) : existingDevice.dnsServers,
          assetId: assetId || existingDevice.assetId,
          metadata: metadata ? JSON.stringify(metadata) : existingDevice.metadata,
          lastSeen: new Date(),
          isActive: true,
        }
      });

      // Log audit trail (discovery/update)
      await auditService.log({
        userId: req.user?.id,
        action: 'DISCOVERY_UPDATE',
        resource: 'NetworkDevice',
        resourceId: updatedDevice.id,
        metadata: { deviceType, ipAddress },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      });

      return res.json(updatedDevice);
    }

    // Create new device
    const device = await prisma.networkDevice.create({
      data: {
        name,
        ipAddress,
        macAddress: macAddress || null,
        hostname: hostname || null,
        deviceType,
        manufacturer: manufacturer || null,
        model: model || null,
        firmware: firmware || null,
        serialNumber: serialNumber || null,
        subnet: subnet || null,
        gateway: gateway || null,
        dnsServers: dnsServers ? JSON.stringify(dnsServers) : null,
        assetId: assetId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        tenantId,
      }
    });

    // Log audit trail (discovery)
    await auditService.log({
      userId: req.user?.id,
      action: 'DISCOVERY_CREATE',
      resource: 'NetworkDevice',
      resourceId: device.id,
      metadata: { deviceType, ipAddress },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(device);
  } catch (error: any) {
    console.error('[NetworkDevices] Error creating/updating device:', error);
    res.status(500).json({
      error: 'Failed to create/update network device',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/network-devices/:id - Update device
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const {
      name,
      ipAddress,
      macAddress,
      hostname,
      deviceType,
      manufacturer,
      model,
      firmware,
      serialNumber,
      subnet,
      gateway,
      dnsServers,
      assetId,
      isActive,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update network devices'
      });
    }

    const existingDevice = await prisma.networkDevice.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingDevice) {
      return res.status(404).json({
        error: 'Network device not found',
        message: 'Device does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress;
    if (macAddress !== undefined) updateData.macAddress = macAddress;
    if (hostname !== undefined) updateData.hostname = hostname;
    if (deviceType !== undefined) updateData.deviceType = deviceType;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (model !== undefined) updateData.model = model;
    if (firmware !== undefined) updateData.firmware = firmware;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (subnet !== undefined) updateData.subnet = subnet;
    if (gateway !== undefined) updateData.gateway = gateway;
    if (dnsServers !== undefined) updateData.dnsServers = dnsServers ? JSON.stringify(dnsServers) : null;
    if (assetId !== undefined) updateData.assetId = assetId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;
    updateData.lastSeen = new Date();

    const updatedDevice = await prisma.networkDevice.update({
      where: { id },
      data: updateData
    });

    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'NetworkDevice',
      resourceId: updatedDevice.id,
      metadata: { changes: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedDevice);
  } catch (error: any) {
    console.error('[NetworkDevices] Error updating device:', error);
    res.status(500).json({
      error: 'Failed to update network device',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/network-devices/:id/ping - Ping device (update lastSeen)
router.post('/:id/ping', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const device = await prisma.networkDevice.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!device) {
      return res.status(404).json({
        error: 'Network device not found',
        message: 'Device does not exist or you do not have access to it'
      });
    }

    const updatedDevice = await prisma.networkDevice.update({
      where: { id },
      data: {
        lastSeen: new Date(),
        isActive: true,
      }
    });

    res.json(updatedDevice);
  } catch (error: any) {
    console.error('[NetworkDevices] Error pinging device:', error);
    res.status(500).json({
      error: 'Failed to ping network device',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/network-devices/:id - Delete device
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete network devices'
      });
    }

    const device = await prisma.networkDevice.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!device) {
      return res.status(404).json({
        error: 'Network device not found',
        message: 'Device does not exist or you do not have access to it'
      });
    }

    await prisma.networkDevice.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'NetworkDevice',
      resourceId: id,
      metadata: { name: device.name, deviceType: device.deviceType },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[NetworkDevices] Error deleting device:', error);
    res.status(500).json({
      error: 'Failed to delete network device',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

