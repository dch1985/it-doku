import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { ApplicationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApplicationError('User not found', 404);
    }

    // Try to find user in database
    let user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    // If user doesn't exist, create it
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: req.user.email,
          name: req.user.name,
          role: req.user.role || 'USER',
          // Store Azure ID if available
          ...(req.user.azureId && { 
            azureId: req.user.azureId,
            azureOID: req.user.azureOID,
          }),
        },
      });
    } else {
      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    console.error('[Auth] Error fetching user:', error);
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Failed to fetch user', 500);
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (client-side token removal)
 */
router.post('/logout', optionalAuthenticate, async (req: Request, res: Response) => {
  // Logout is handled client-side by removing the token
  // This endpoint can be used for server-side cleanup if needed
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/verify
 * Verify if token is valid
 */
router.get('/verify', authenticate, async (req: Request, res: Response) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router;

