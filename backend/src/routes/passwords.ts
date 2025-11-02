import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { encryptPassword, decryptPassword } from '../services/encryption.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { auditService } from '../services/audit.service.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

// GET /api/passwords - List passwords (tenant-filtered)
router.get('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view passwords'
      });
    }

    const passwords = await prisma.password.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    res.json(passwords);
  } catch (error: any) {
    console.error('[Passwords] Error fetching passwords:', error);
    res.status(500).json({
      error: 'Failed to fetch passwords',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/passwords/:id - Get single password (without decryption)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    const password = await prisma.password.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    if (!password) {
      return res.status(404).json({
        error: 'Password not found',
        message: 'Password does not exist or you do not have access to it'
      });
    }

    res.json(password);
  } catch (error: any) {
    console.error('[Passwords] Error fetching password:', error);
    res.status(500).json({
      error: 'Failed to fetch password',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/passwords/:id/reveal - Temporarily reveal password (with audit log)
router.post('/:id/reveal', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to reveal passwords'
      });
    }

    const password = await prisma.password.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!password) {
      return res.status(404).json({
        error: 'Password not found',
        message: 'Password does not exist or you do not have access to it'
      });
    }

    // Decrypt password
    const encryptedData = {
      encrypted: password.password,
      iv: '', // Store IV separately or in password field with delimiter
      tag: '',
      salt: password.encryptionKey || '',
    };

    // Parse encrypted data (assuming format: encrypted:iv:tag:salt)
    const parts = password.password.split(':');
    if (parts.length === 4) {
      encryptedData.encrypted = parts[0];
      encryptedData.iv = parts[1];
      encryptedData.tag = parts[2];
      encryptedData.salt = parts[3];
    }

    const decryptedPassword = decryptPassword(encryptedData, tenantId || undefined);

    // Log access for audit
    await auditService.log({
      userId,
      action: 'PASSWORD_REVEAL',
      resource: 'Password',
      resourceId: id,
      metadata: { passwordName: password.name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      id: password.id,
      name: password.name,
      username: password.username,
      password: decryptedPassword, // Only returned on explicit reveal
      url: password.url,
      notes: password.notes,
      expiresAt: password.expiresAt,
    });
  } catch (error: any) {
    console.error('[Passwords] Error revealing password:', error);
    res.status(500).json({
      error: 'Failed to reveal password',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/passwords - Create password
router.post('/', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const { name, username, password: plainPassword, url, notes, tags, expiresAt, assetId } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create passwords'
      });
    }

    if (!name || !plainPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and password are required'
      });
    }

    // Encrypt password
    const tenantId = req.tenant?.id || null;
    const encryptedData = encryptPassword(plainPassword, tenantId || undefined);

    // Store encrypted data (format: encrypted:iv:tag:salt)
    const encryptedPassword = `${encryptedData.encrypted}:${encryptedData.iv}:${encryptedData.tag}:${encryptedData.salt}`;

    const password = await prisma.password.create({
      data: {
        name,
        username: username || null,
        password: encryptedPassword,
        url: url || null,
        notes: notes || null,
        tags: tags ? JSON.stringify(tags) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        lastChanged: new Date(),
        encrypted: true,
        encryptionKey: encryptedData.salt,
        tenantId,
        userId: req.user.id,
        assetId: assetId || null,
      }
    });

    // Remove encrypted password from response
    const { password: _, ...passwordResponse } = password;

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Password',
      resourceId: password.id,
      metadata: { name: password.name, url: password.url },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(passwordResponse);
  } catch (error: any) {
    console.error('[Passwords] Error creating password:', error);
    res.status(500).json({
      error: 'Failed to create password',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/passwords/:id - Update password
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username, password: plainPassword, url, notes, tags, expiresAt, assetId } = req.body;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update passwords'
      });
    }

    const existingPassword = await prisma.password.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existingPassword) {
      return res.status(404).json({
        error: 'Password not found',
        message: 'Password does not exist or you do not have access to it'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (url !== undefined) updateData.url = url;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (assetId !== undefined) updateData.assetId = assetId || null;

    // If password is provided, encrypt it
    if (plainPassword) {
      const encryptedData = encryptPassword(plainPassword, tenantId || undefined);
      const encryptedPassword = `${encryptedData.encrypted}:${encryptedData.iv}:${encryptedData.tag}:${encryptedData.salt}`;
      updateData.password = encryptedPassword;
      updateData.lastChanged = new Date();
      updateData.encryptionKey = encryptedData.salt;
    }

    const updatedPassword = await prisma.password.update({
      where: { id },
      data: updateData
    });

    // Remove encrypted password from response
    const { password: _, ...passwordResponse } = updatedPassword;

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Password',
      resourceId: updatedPassword.id,
      metadata: { changedFields: Object.keys(updateData) },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(passwordResponse);
  } catch (error: any) {
    console.error('[Passwords] Error updating password:', error);
    res.status(500).json({
      error: 'Failed to update password',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/passwords/:id - Delete password
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete passwords'
      });
    }

    const password = await prisma.password.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!password) {
      return res.status(404).json({
        error: 'Password not found',
        message: 'Password does not exist or you do not have access to it'
      });
    }

    await prisma.password.delete({
      where: { id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'Password',
      resourceId: id,
      metadata: { name: password.name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Passwords] Error deleting password:', error);
    res.status(500).json({
      error: 'Failed to delete password',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

