import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * Development Authentication Middleware
 * Allows testing without Azure AD B2C by creating/finding a demo user
 * Only active when NODE_ENV=development and DEV_AUTH_ENABLED=true
 */

// Extend Request interface
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      azureId?: string;
      azureOID?: string;
    };
  }
}

/**
 * Development Authentication Middleware
 * Creates or finds a demo user for testing
 */
export const devAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if dev mode is enabled
    // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    if (!isDevMode) {
      return next(); // Skip if not in dev mode
    }

    // Try to find or create demo user
    let demoUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo@it-doku.local' },
          { email: 'dev@it-doku.local' },
        ],
      },
    });

    if (!demoUser) {
      // Create demo user
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@it-doku.local',
          name: 'Demo User',
          role: 'ADMIN',
        },
      });
      console.log('[Dev Auth] Created demo user:', demoUser.email);
    }

    // Attach user to request
    req.user = {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
    };

    next();
  } catch (error) {
    console.error('[Dev Auth] Error:', error);
    next(); // Continue even if dev auth fails
  }
};

/**
 * Development Optional Authentication
 * Similar to devAuthenticate but doesn't fail if no user found
 */
export const devOptionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if dev mode is enabled
  // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
  if (!isDevMode) {
    return next();
  }

  try {
    let demoUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo@it-doku.local' },
          { email: 'dev@it-doku.local' },
        ],
      },
    });

    if (demoUser) {
      req.user = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      };
    }
  } catch (error) {
    console.warn('[Dev Auth] Optional auth failed:', error);
  }

  next();
};

