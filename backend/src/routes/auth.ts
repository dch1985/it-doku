import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { ApplicationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * Development Mode: POST /api/auth/dev-login
 * Login endpoint for development mode (without Azure AD)
 * Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
 */
router.post('/dev-login', async (req: Request, res: Response) => {
  // Check if dev login is enabled
  // IMPORTANT: dotenv.config() must be called in index.ts before routes are loaded
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
  
  // Debug logging
  console.log('[Auth] Dev login check:', {
    NODE_ENV: process.env.NODE_ENV,
    DEV_AUTH_ENABLED: process.env.DEV_AUTH_ENABLED,
    isDevMode
  });
  
  if (!isDevMode) {
    console.warn('[Auth] Dev login attempted but not in dev mode');
    console.warn('[Auth] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DEV_AUTH_ENABLED: process.env.DEV_AUTH_ENABLED,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('DEV') || k.includes('NODE'))
    });
    return res.status(403).json({ 
      error: 'Dev login not available', 
      message: 'NODE_ENV must be "development" or DEV_AUTH_ENABLED must be "true"',
      currentEnv: {
        NODE_ENV: process.env.NODE_ENV,
        DEV_AUTH_ENABLED: process.env.DEV_AUTH_ENABLED
      },
      help: 'Please add DEV_AUTH_ENABLED=true to backend/.env and restart the server'
    });
  }

  try {
    // Find or create demo user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo@it-doku.local' },
          { email: 'dev@it-doku.local' },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@it-doku.local',
          name: 'Demo User',
          role: 'ADMIN',
        },
      });
    }

    // Return user data (no JWT token needed in dev mode)
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      devMode: true,
    });
  } catch (error) {
    console.error('[Auth] Dev login error:', error);
    res.status(500).json({ error: 'Failed to create dev user' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 * In dev mode, uses devAuthenticate if enabled, otherwise requires token
 */
const meAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
  
  if (isDevMode) {
    // Apply dev authentication
    return devAuthenticate(req, res, next);
  } else {
    // In production, require token authentication
    return authenticate(req, res, next);
  }
};

router.get('/me', meAuthMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new ApplicationError('User not authenticated', 401);
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

