import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApplicationError } from './errorHandler.js';

/**
 * Validation middleware factory
 * Creates middleware to validate request data against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, query, and params
      const data = {
        body: req.body,
        query: req.query,
        params: req.params
      };

      await schema.parseAsync(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for response
        const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
          timestamp: new Date().toISOString()
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  }),

  // Document creation/update
  documentCreate: z.object({
    body: z.object({
      title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
      content: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'REVIEW']).optional(),
    })
  }),

  documentUpdate: z.object({
    params: z.object({
      id: z.string().uuid('Invalid document ID')
    }),
    body: z.object({
      title: z.string().min(1).max(500).optional(),
      content: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'REVIEW']).optional(),
    })
  }),

  documentGet: z.object({
    params: z.object({
      id: z.string().uuid('Invalid document ID')
    })
  }),

  // Chat validation
  chatRequest: z.object({
    body: z.object({
      messages: z.array(
        z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string().min(1, 'Message content is required')
        })
      ).min(1, 'At least one message is required').max(50, 'Too many messages')
    })
  })
};

