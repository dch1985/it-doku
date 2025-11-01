import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from './errorHandler.js';

// Extend Express Request type to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        slug: string;
        subscriptionStatus: string;
        subscriptionPlan?: string | null;
      };
      tenantMember?: {
        role: string;
      };
    }
  }
}

/**
 * Tenant Middleware
 * Extracts tenant from request (header, subdomain, or query param)
 * and validates user membership
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get tenant identifier from various sources
    // Priority: 1. Header, 2. Subdomain, 3. Query param
    let tenantIdentifier: string | undefined;

    // Option 1: From X-Tenant-ID or X-Tenant-Slug header
    tenantIdentifier = 
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-tenant-slug'] as string);

    // Option 2: From subdomain (e.g., tenant-slug.app.com)
    if (!tenantIdentifier && req.headers.host) {
      const host = req.headers.host;
      const parts = host.split('.');
      if (parts.length > 2) {
        tenantIdentifier = parts[0]; // First subdomain
      }
    }

    // Option 3: From query parameter
    if (!tenantIdentifier) {
      tenantIdentifier = req.query.tenantId as string || req.query.tenantSlug as string;
    }

    if (!tenantIdentifier) {
      // Allow public endpoints (health, docs) without tenant
      if (req.path === '/api/health' || req.path === '/api/docs' || req.path.startsWith('/api/auth')) {
        return next();
      }
      // In dev mode, if no tenant is provided but user is authenticated, we can continue
      // This allows testing without tenant selection
      // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
      const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
      if (isDevMode && req.user) {
        console.log('[Tenant Middleware] Dev mode: Allowing request without tenant');
        return next();
      }
      throw new ApplicationError('Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header.', 400);
    }

    // Find tenant by ID or slug
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantIdentifier },
          { slug: tenantIdentifier },
        ],
      },
    });

    if (!tenant) {
      throw new ApplicationError('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      throw new ApplicationError('Tenant is inactive', 403);
    }

    // Check if user is authenticated and get their membership
    let tenantMember = null;
    if (req.user?.id) {
      tenantMember = await prisma.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: req.user.id,
          },
        },
      });
    }

    // Set tenant and membership in request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.subscriptionPlan,
    };

    if (tenantMember) {
      req.tenantMember = {
        role: tenantMember.role,
      };
    }

    next();
  } catch (error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    console.error('[Tenant] Middleware error:', error);
    next(new ApplicationError('Tenant resolution failed', 500));
  }
};

/**
 * Optional Tenant Middleware
 * Doesn't fail if no tenant is provided (for public endpoints)
 */
export const optionalTenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tenantIdentifier = 
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-tenant-slug'] as string) ||
    (req.query.tenantId as string) ||
    (req.query.tenantSlug as string);

  if (!tenantIdentifier) {
    return next(); // Continue without tenant
  }

  // Use the regular tenant middleware
  return tenantMiddleware(req, res, next);
};

/**
 * Tenant Member Authorization Middleware
 * Checks if user has required role in tenant
 */
export const requireTenantRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return next(new ApplicationError('Tenant context required', 400));
    }

    if (!req.tenantMember) {
      return next(new ApplicationError('Tenant membership required', 403));
    }

    if (!roles.includes(req.tenantMember.role)) {
      return next(
        new ApplicationError(
          `Insufficient tenant permissions. Required roles: ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

