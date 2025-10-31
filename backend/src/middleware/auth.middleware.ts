import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { ApplicationError } from './errorHandler.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
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
}

// Azure AD Configuration
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;

// JWKS Client for fetching Azure AD public keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Get signing key for JWT verification
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Authentication Middleware
 * Validates JWT tokens from Azure AD B2C
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApplicationError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new ApplicationError('No token provided', 401);
    }

    // Verify JWT token
    jwt.verify(
      token,
      getKey,
      {
        audience: AZURE_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`,
        algorithms: ['RS256'],
      },
      (err, decoded: any) => {
        if (err) {
          console.error('[Auth] Token verification failed:', err.message);
          return next(new ApplicationError('Invalid or expired token', 401));
        }

        // Extract user information from token
        req.user = {
          id: decoded.oid || decoded.sub, // Azure Object ID or Subject
          email: decoded.email || decoded.preferred_username,
          name: decoded.name || decoded.preferred_username,
          role: decoded.roles?.[0] || 'USER', // Extract first role if available
          azureId: decoded.oid,
          azureOID: decoded.oid,
        };

        next();
      }
    );
  } catch (error) {
    if (error instanceof ApplicationError) {
      return next(error);
    }
    console.error('[Auth] Authentication error:', error);
    next(new ApplicationError('Authentication failed', 401));
  }
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token is provided (for public endpoints)
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  // Use the regular authenticate middleware
  return authenticate(req, res, next);
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApplicationError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApplicationError('Insufficient permissions', 403)
      );
    }

    next();
  };
};

