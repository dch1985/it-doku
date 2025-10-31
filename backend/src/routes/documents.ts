import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware, optionalTenantMiddleware } from '../middleware/tenant.middleware.js'

const router = Router()

// Apply tenant middleware to all routes
router.use(tenantMiddleware)

// Get all documents
router.get('/', async (req: Request, res: Response) => {
  try {
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
    if (!req.tenant) {
      throw new Error('Tenant context required')
    }

    const { id } = req.params
    
    const document = await prisma.document.findFirst({
      where: {
        id: id,
        tenantId: req.tenant.id // Tenant isolation
      },
      include: { versions: true }
    })
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }
    
    res.json(document)
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to fetch document' })
  }
})

// Create document
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.tenant || !req.user) {
      throw new Error('Tenant and user context required')
    }

    const { title, content, category } = req.body
    
    const document = await prisma.document.create({
      data: {
        title,
        content: content || '',
        category: category || 'DOCUMENTATION',
        tenantId: req.tenant.id, // Tenant isolation
        userId: req.user.id, // Current user
        status: 'DRAFT' // Uppercase wie im Schema definiert
      }
    })
    
    res.status(201).json(document)
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to create document' })
  }
})

// Update document
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      throw new Error('Tenant context required')
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
      return res.status(404).json({ error: 'Document not found' })
    }
    
    const document = await prisma.document.update({
      where: { id: id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(category && { category }),
        ...(status && { status: status.toUpperCase() }), // Ensure uppercase
        version: { increment: 1 } // Increment version number
      }
    })
    
    // Version-History: Erstelle neue Version als neues Document mit parentId
    // (Schema verwendet parentId-Relation für Versions)
    if (document) {
      const versionCount = await prisma.document.count({
        where: { parentId: document.parentId || document.id }
      })
      
      // Optional: Version als neues Document speichern (wenn gewünscht)
      // await prisma.document.create({
      //   data: {
      //     title: document.title,
      //     content: document.content,
      //     category: document.category,
      //     userId: document.userId,
      //     parentId: document.parentId || document.id,
      //     status: document.status,
      //     version: document.version
      //   }
      // })
    }
    
    res.json(document)
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to update document' })
  }
})

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      throw new Error('Tenant context required')
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
      return res.status(404).json({ error: 'Document not found' })
    }
    
    await prisma.document.delete({
      where: { id: id }
    })
    
    res.status(204).send()
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

export default router