import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware, optionalTenantMiddleware } from '../middleware/tenant.middleware.js'
import { getCategoryTemplate, applyCategoryTemplate } from '../templates/categoryTemplates.js'
import { auditService } from '../services/audit.service.js'

const router = Router()

// Apply tenant middleware to all routes
router.use(tenantMiddleware)

// Get all documents
router.get('/', async (req: Request, res: Response) => {
  try {
    // In dev mode, allow requests without tenant (for testing)
    // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    if (!req.tenant && isDevMode) {
      console.log('[Documents] Dev mode: Fetching all documents without tenant filter');
      const documents = await prisma.document.findMany({
        orderBy: { updatedAt: 'desc' }
      })
      return res.json(documents)
    }
    
    if (!req.tenant) {
      throw new Error('Tenant context required')
    }

    const documents = await prisma.document.findMany({
      where: {
        tenantId: req.tenant.id
      },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(documents)
  } catch (error: any) {
    console.error('[Documents] Error:', error)
    console.error('[Documents] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    
    // Check if it's a database connection/firewall error
    const isFirewallError = error.message?.includes('firewall') || 
                           error.message?.includes('not allowed to access') ||
                           error.code === 'P1001'
    
    if (isFirewallError) {
      console.error('[Documents] ⚠️ Azure SQL Firewall Error - Database not accessible')
      return res.status(503).json({ 
        error: 'Database connection failed',
        message: 'Azure SQL Server firewall is blocking the connection. Please add your IP address to the firewall rules.',
        code: 'FIREWALL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch documents',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    })
  }
})

// Get single document
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // In dev mode, allow requests without tenant (for testing)
    // Works if NODE_ENV=development OR DEV_AUTH_ENABLED=true
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    if (!req.tenant && isDevMode) {
      console.log('[Documents] Dev mode: Fetching document without tenant filter');
      const { id } = req.params;
      const document = await prisma.document.findFirst({
        where: { id: id },
        include: { versions: true }
      });
      if (!document) {
        return res.status(404).json({ 
          error: 'Document not found',
          message: 'Document does not exist'
        });
      }
      return res.json(document);
    }
    
    if (!req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { id } = req.params
    
    // Validate ID format (should be UUID)
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid document ID',
        message: 'Document ID must be a valid UUID'
      })
    }
    
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        tenantId: req.tenant.id // Tenant isolation
      },
      include: { versions: true }
    })
    
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'Document does not exist or you do not have access to it'
      })
    }
    
    res.json(document)
  } catch (error: any) {
    console.error('[Documents] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2023') {
      return res.status(400).json({ 
        error: 'Invalid document ID',
        message: 'The provided document ID format is invalid'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch document',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Create document
router.post('/', async (req: Request, res: Response) => {
  try {
    // In dev mode, allow requests without tenant (for testing)
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    
    // User context is always required
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to create documents'
      })
    }
    
    // In production mode, tenant is required
    if (!isDevMode && !req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { title, content, category } = req.body
    
    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Document title is required'
      })
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Document title must be less than 200 characters'
      })
    }

    // Validate category if provided
    const validCategories = ['DOCUMENTATION', 'CODE_ANALYSIS', 'TEMPLATE', 'KNOWLEDGE_BASE', 'MEETING_NOTES', 'TUTORIAL', 'API_SPEC']
    const documentCategory = category ? category.toUpperCase() : 'DOCUMENTATION'
    
    if (category && !validCategories.includes(documentCategory)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      })
    }
    
    // Apply category-based template if no content provided
    let documentContent = content || ''
    if (!content || content.trim().length === 0) {
      const categoryTemplate = getCategoryTemplate(documentCategory)
      if (categoryTemplate) {
        documentContent = applyCategoryTemplate(categoryTemplate, title.trim())
      } else {
        // Fallback for categories without templates
        documentContent = `<h1>${title.trim()}</h1><p>Start writing...</p>`
      }
    }
    
    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        content: documentContent,
        category: documentCategory,
        tenantId: req.tenant?.id || null, // Tenant isolation (null in dev mode)
        userId: req.user.id, // Current user
        status: 'DRAFT' // Uppercase wie im Schema definiert
      }
    })
    
    // Log audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE',
      resource: 'Document',
      resourceId: document.id,
      metadata: { title: document.title, category: documentCategory },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    })
    
    res.status(201).json(document)
  } catch (error: any) {
    console.error('[Documents] Error creating document:', error)
    console.error('[Documents] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'A document with this title already exists for this tenant'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to create document',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Update document
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { id } = req.params
    const { title, content, category, status } = req.body
    
    // Verify document belongs to tenant
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: id,
        tenantId: req.tenant.id
      }
    })

    if (!existingDoc) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'Document does not exist or you do not have access to it'
      })
    }

    // Validation
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Title must be a non-empty string'
        })
      }
      if (title.length > 500) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Title must be less than 500 characters'
        })
      }
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['DOCUMENTATION', 'CODE_ANALYSIS', 'TEMPLATE', 'KNOWLEDGE_BASE', 'MEETING_NOTES', 'TUTORIAL', 'API_SPEC']
      if (!validCategories.includes(category.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        })
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        })
      }
    }
    
    const document = await prisma.document.update({
      where: { id: id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(category && { category: category.toUpperCase() }),
        ...(status && { status: status.toUpperCase() }), // Ensure uppercase
        version: { increment: 1 } // Increment version number
      }
    })
    
    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'UPDATE',
      resource: 'Document',
      resourceId: document.id,
      metadata: { changes: { title, category, status } },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    })
    
    res.json(document)
  } catch (error: any) {
    console.error('[Documents] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The document you are trying to update does not exist'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to update document',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Version history is now handled by audit logs
// Use /api/audit/resource/Document/:id to get version history

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { id } = req.params
    
    // Verify document belongs to tenant
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: id,
        tenantId: req.tenant.id
      }
    })

    if (!existingDoc) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'Document does not exist or you do not have access to it'
      })
    }
    
    await prisma.document.delete({
      where: { id: id }
    })
    
    // Log audit trail
    await auditService.log({
      userId: req.user?.id,
      action: 'DELETE',
      resource: 'Document',
      resourceId: id,
      metadata: { title: existingDoc.title },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    })
    
    res.status(204).send()
  } catch (error: any) {
    console.error('[Documents] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The document you are trying to delete does not exist'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to delete document',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

export default router