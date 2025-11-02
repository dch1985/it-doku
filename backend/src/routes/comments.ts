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

// Get all comments for a document
router.get('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;

    const where: any = {
      documentId: documentId
    };
    
    if (tenantId) {
      where.document = {
        tenantId: tenantId
      };
    } else if (!isDevMode) {
      return res.status(400).json({
        error: 'Tenant required',
        message: 'Please select a tenant to view comments'
      });
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        parent: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error: any) {
    console.error('[Comments] Error fetching comments:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Create a new comment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { documentId, content, parentId } = req.body;

    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create comments'
      });
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Comment content is required'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Comment must be less than 5000 characters'
      });
    }

    // Verify document belongs to tenant (or allow in dev mode)
    const whereDocument: any = {
      id: documentId
    };
    if (tenantId) {
      whereDocument.tenantId = tenantId;
    }

    const document = await prisma.document.findFirst({
      where: whereDocument
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document does not exist or you do not have access to it'
      });
    }

    // If parentId is provided, verify it exists and belongs to the same document
    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: {
          id: parentId,
          documentId: documentId
        }
      });

      if (!parent) {
        return res.status(404).json({
          error: 'Parent comment not found',
          message: 'The parent comment does not exist'
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        documentId: documentId,
        userId: req.user.id,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        parent: true
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Comment',
      resourceId: comment.id,
      metadata: { documentId, parentId, contentLength: content.length },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('[Comments] Error creating comment:', error);
    res.status(500).json({
      error: 'Failed to create comment',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Update a comment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, resolved } = req.body;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update comments'
      });
    }

    // Get existing comment without tenant filter in dev mode
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;

    const whereComment: any = {
      id: id
    };
    if (tenantId) {
      whereComment.document = {
        tenantId: tenantId
      };
    }

    const existingComment = await prisma.comment.findFirst({
      where: whereComment
    });

    if (!existingComment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'Comment does not exist or you do not have access to it'
      });
    }

    // Only allow comment owner to update content
    if (content !== undefined && existingComment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only edit your own comments'
      });
    }

    // Validate content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Comment content cannot be empty'
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Comment must be less than 5000 characters'
        });
      }
    }

    const comment = await prisma.comment.update({
      where: { id: id },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(resolved !== undefined && { resolved: resolved })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        parent: true
      }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE',
      resource: 'Comment',
      resourceId: comment.id,
      metadata: { resolved, contentLength: content?.length },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json(comment);
  } catch (error: any) {
    console.error('[Comments] Error updating comment:', error);
    res.status(500).json({
      error: 'Failed to update comment',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Delete a comment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete comments'
      });
    }

    // Get existing comment without tenant filter in dev mode
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    const tenantId = req.tenant?.id;

    const whereComment: any = {
      id: id
    };
    if (tenantId) {
      whereComment.document = {
        tenantId: tenantId
      };
    }

    const existingComment = await prisma.comment.findFirst({
      where: whereComment
    });

    if (!existingComment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'Comment does not exist or you do not have access to it'
      });
    }

    // Only allow comment owner to delete (or admin)
    if (existingComment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own comments'
      });
    }

    await prisma.comment.delete({
      where: { id: id }
    });

    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE',
      resource: 'Comment',
      resourceId: id,
      metadata: { documentId: existingComment.documentId },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Comments] Error deleting comment:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

