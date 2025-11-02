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

// GET /api/process-recordings - List process recordings
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;
    const { search, processType, status } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view process recordings'
      });
    }

    if (processType && typeof processType === 'string') {
      where.processType = processType;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { processType: { contains: search } },
      ];
    }

    const recordings = await prisma.processRecording.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            // Add relations if needed in future
          }
        }
      }
    });

    res.json(recordings);
  } catch (error: any) {
    console.error('[ProcessRecordings] Error fetching recordings:', error);
    res.status(500).json({
      error: 'Failed to fetch process recordings',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/process-recordings/:id - Get recording details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const recording = await prisma.processRecording.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (!recording) {
      return res.status(404).json({
        error: 'Process recording not found',
        message: 'Recording does not exist or you do not have access to it'
      });
    }

    res.json(recording);
  } catch (error: any) {
    console.error('[ProcessRecordings] Error fetching recording:', error);
    res.status(500).json({
      error: 'Failed to fetch process recording',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/process-recordings - Create recording
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const {
      name,
      description,
      processType,
      steps,
      status,
      version,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create process recordings'
      });
    }

    if (!title || !processType) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Title and process type are required'
      });
    }

    const tenantId = req.tenant?.id || null;

    const recording = await prisma.processRecording.create({
      data: {
        title,
        description: description || null,
        processType,
        steps: steps ? JSON.stringify(steps) : null,
        status: status || 'RECORDING',
        metadata: metadata ? JSON.stringify(metadata) : null,
        tenantId,
        userId: req.user.id,
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'ProcessRecording',
      resourceId: recording.id,
      metadata: { title: recording.title, processType: recording.processType },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(recording);
  } catch (error: any) {
    console.error('[ProcessRecordings] Error creating recording:', error);
    res.status(500).json({
      error: 'Failed to create process recording',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/process-recordings/:id - Update recording
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const {
      name,
      description,
      processType,
      steps,
      status,
      version,
      metadata
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update process recordings'
      });
    }

    const existingRecording = await prisma.processRecording.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingRecording) {
      return res.status(404).json({
        error: 'Process recording not found',
        message: 'Recording does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (processType !== undefined) updateData.processType = processType;
    if (steps !== undefined) updateData.steps = steps ? JSON.stringify(steps) : null;
    if (status !== undefined) updateData.status = status;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    const updatedRecording = await prisma.processRecording.update({
      where: { id },
      data: updateData
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'ProcessRecording',
      resourceId: updatedRecording.id,
      metadata: { changes: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(updatedRecording);
  } catch (error: any) {
    console.error('[ProcessRecordings] Error updating recording:', error);
    res.status(500).json({
      error: 'Failed to update process recording',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/process-recordings/:id - Delete recording
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete process recordings'
      });
    }

    const recording = await prisma.processRecording.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!recording) {
      return res.status(404).json({
        error: 'Process recording not found',
        message: 'Recording does not exist or you do not have access to it'
      });
    }

    await prisma.processRecording.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'ProcessRecording',
      resourceId: id,
      metadata: { title: recording.title },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[ProcessRecordings] Error deleting recording:', error);
    res.status(500).json({
      error: 'Failed to delete process recording',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

