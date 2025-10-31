import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Request interface to include rateLimit
declare module 'express-serve-static-core' {
  interface Request {
    rateLimit?: {
      resetTime?: number;
      limit?: number;
      current?: number;
      remaining?: number;
    };
  }
}

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    const resetTime = req.rateLimit?.resetTime || Date.now() + 900000;
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits each IP to 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for AI chat endpoints (cost-intensive)
 * Limits each IP to 20 requests per hour
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per hour
  message: {
    error: 'Too many chat requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for file upload endpoints
 * Limits each IP to 10 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

