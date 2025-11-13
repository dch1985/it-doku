import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { notificationService } from '../services/notification.service.js';

const router = Router();

// Apply authentication and tenant middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

/**
 * POST /api/reviews - Create a new review request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { documentId, reviewerId } = req.body;

    if (!documentId || !reviewerId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'documentId and reviewerId are required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create a review request'
      });
    }

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Document not found'
      });
    }

    // Check if reviewer exists
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId }
    });

    if (!reviewer) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Reviewer not found'
      });
    }

    // Check if there's already a pending review request
    const existingRequest = await prisma.reviewRequest.findFirst({
      where: {
        documentId,
        reviewerId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A pending review request for this document and reviewer already exists'
      });
    }

    // Create review request
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        documentId,
        requestedBy: req.user.id,
        reviewerId,
        status: 'PENDING'
      },
      include: {
        document: {
          select: {
            id: true,
            title: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send notification to reviewer
    await notificationService.create({
      userId: reviewerId,
      type: 'REVIEW_REQUESTED',
      title: 'Review Request',
      message: `${req.user.name} requested your review for "${document.title}"`,
      link: `/documents/${documentId}`,
      metadata: {
        documentId,
        requesterId: req.user.id,
        reviewRequestId: reviewRequest.id
      }
    });

    res.status(201).json(reviewRequest);
  } catch (error: any) {
    console.error('[Review] Error creating review request:', error);
    res.status(500).json({
      error: 'Failed to create review request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/reviews - Get review requests
 * Query params: documentId, reviewerId, status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { documentId, reviewerId, status } = req.query;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to view review requests'
      });
    }

    const where: any = {};

    if (documentId) {
      where.documentId = documentId as string;
    }

    if (reviewerId) {
      where.reviewerId = reviewerId as string;
    } else {
      // If no specific reviewer provided, show requests for current user
      where.reviewerId = req.user.id;
    }

    if (status) {
      where.status = status as string;
    }

    const reviewRequests = await prisma.reviewRequest.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reviewRequests);
  } catch (error: any) {
    console.error('[Review] Error fetching review requests:', error);
    res.status(500).json({
      error: 'Failed to fetch review requests',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

/**
 * PATCH /api/reviews/:id - Update review request status
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'PENDING'].includes(status)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Valid status is required (APPROVED, REJECTED, CHANGES_REQUESTED, PENDING)'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update review request'
      });
    }

    // Check if review request exists and user is the reviewer
    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!reviewRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Review request not found'
      });
    }

    if (reviewRequest.reviewerId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to update this review request'
      });
    }

    // Update review request
    const updatedRequest = await prisma.reviewRequest.update({
      where: { id },
      data: {
        status,
        comments,
        reviewedAt: new Date()
      },
      include: {
        document: {
          select: {
            id: true,
            title: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // If approved, update document status to PUBLISHED
    if (status === 'APPROVED') {
      await prisma.document.update({
        where: { id: reviewRequest.document.id },
        data: { status: 'PUBLISHED' }
      });
    }

    // Send notification to requester
    await notificationService.create({
      userId: reviewRequest.requestedBy,
      type: status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_CHANGES_REQUESTED',
      title: status === 'APPROVED' ? 'Document Approved' : 'Changes Requested',
      message: `${req.user.name} ${status.toLowerCase()} your document "${reviewRequest.document.title}"`,
      link: `/documents/${reviewRequest.document.id}`,
      metadata: {
        documentId: reviewRequest.document.id,
        reviewerId: req.user.id,
        reviewRequestId: id,
        status
      }
    });

    res.json(updatedRequest);
  } catch (error: any) {
    console.error('[Review] Error updating review request:', error);
    res.status(500).json({
      error: 'Failed to update review request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

/**
 * DELETE /api/reviews/:id - Cancel a review request
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to cancel review request'
      });
    }

    // Check if review request exists and user is the requester
    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { id }
    });

    if (!reviewRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Review request not found'
      });
    }

    if (reviewRequest.requestedBy !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to cancel this review request'
      });
    }

    // Delete review request
    await prisma.reviewRequest.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Review] Error deleting review request:', error);
    res.status(500).json({
      error: 'Failed to delete review request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

