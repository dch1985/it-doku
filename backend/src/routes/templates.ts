import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { tenantMiddleware, optionalTenantMiddleware } from '../middleware/tenant.middleware.js'
import { stateOfTheArtTemplates } from '../templates/templateDefinitions.js'

const router = Router()

// Apply tenant middleware to all routes
router.use(tenantMiddleware)

// Get all templates (tenant-specific + global)
router.get('/', async (req: Request, res: Response) => {
  try {
    // In dev mode, allow requests without tenant (for testing)
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    
    let whereClause: any = {};
    
    if (req.tenant) {
      // Get templates: tenant-specific OR global templates
      whereClause = {
        OR: [
          { tenantId: req.tenant.id },
          { isGlobal: true }
        ]
      };
    } else if (isDevMode) {
      console.log('[Templates] Dev mode: Fetching all templates without tenant filter');
      // In dev mode, get all templates if no tenant
      whereClause = {};
    } else {
      // Only global templates if no tenant
      whereClause = { isGlobal: true };
    }
    
    const templates = await prisma.template.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })
    
    res.json(templates)
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Get single template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    
    let whereClause: any = { id };
    
    if (req.tenant) {
      // Template must be tenant-specific OR global
      whereClause = {
        id,
        OR: [
          { tenantId: req.tenant.id },
          { isGlobal: true }
        ]
      };
    } else if (!isDevMode) {
      // Only global templates if no tenant and not in dev mode
      whereClause = { id, isGlobal: true };
    }
    
    const template = await prisma.template.findFirst({
      where: whereClause
    })
    
    if (!template) {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'Template does not exist or you do not have access to it'
      })
    }
    
    res.json(template)
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch template',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Create template
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.tenant && !req.body.isGlobal) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant, or create a global template'
      })
    }

    const { name, description, category, content, structure, isGlobal, tags, isNistCompliant, nistFramework } = req.body
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name is required and must be a non-empty string'
      })
    }

    if (name.length > 200) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Name must be less than 200 characters'
      })
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Category is required'
      })
    }

    // Validate structure if provided (must be valid JSON)
    let parsedStructure = null;
    if (structure) {
      try {
        parsedStructure = typeof structure === 'string' ? JSON.parse(structure) : structure;
      } catch (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Structure must be valid JSON'
        })
      }
    }
    
    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        category: category,
        content: content || '',
        structure: parsedStructure ? JSON.stringify(parsedStructure) : null,
        tenantId: isGlobal ? null : req.tenant?.id,
        isGlobal: isGlobal === true,
        tags: tags ? JSON.stringify(tags) : null,
        isNistCompliant: isNistCompliant === true,
        nistFramework: nistFramework || null,
      }
    })
    
    res.status(201).json(template)
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'A template with this name already exists'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to create template',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Update template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { id } = req.params
    const { name, description, category, content, structure, tags, isNistCompliant, nistFramework } = req.body
    
    // Verify template belongs to tenant (or is global if user is admin)
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: id,
        OR: [
          { tenantId: req.tenant.id },
          { isGlobal: true }
        ]
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'Template does not exist or you do not have access to it'
      })
    }

    // Can only update tenant-specific templates (not global templates)
    if (existingTemplate.isGlobal && existingTemplate.tenantId !== req.tenant.id) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Cannot update global templates'
      })
    }

    // Validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Name must be a non-empty string'
        })
      }
      if (name.length > 200) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Name must be less than 200 characters'
        })
      }
    }

    // Validate structure if provided
    let parsedStructure = null;
    if (structure !== undefined) {
      try {
        parsedStructure = typeof structure === 'string' ? JSON.parse(structure) : structure;
      } catch (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Structure must be valid JSON'
        })
      }
    }
    
    const template = await prisma.template.update({
      where: { id: id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(category && { category }),
        ...(content !== undefined && { content }),
        ...(structure !== undefined && { structure: parsedStructure ? JSON.stringify(parsedStructure) : null }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(isNistCompliant !== undefined && { isNistCompliant }),
        ...(nistFramework !== undefined && { nistFramework }),
      }
    })
    
    res.json(template)
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'The template you are trying to update does not exist'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to update template',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please ensure you have selected a tenant'
      })
    }

    const { id } = req.params
    
    // Verify template belongs to tenant
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: id,
        tenantId: req.tenant.id // Can only delete tenant-specific templates
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'Template does not exist or you do not have access to it'
      })
    }
    
    await prisma.template.delete({
      where: { id: id }
    })
    
    res.status(204).send()
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'The template you are trying to delete does not exist'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to delete template',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Use template to create document
router.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
    
    // In dev mode, allow without tenant/user if authenticated
    if (!isDevMode && (!req.tenant || !req.user)) {
      return res.status(400).json({ 
        error: 'Tenant and user context required',
        message: 'Please ensure you are authenticated and have selected a tenant'
      })
    }

    // In dev mode, we still need user for document creation
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please ensure you are authenticated'
      })
    }

    const { id } = req.params
    const { title, customFields } = req.body
    
    // Get template - in dev mode, allow global templates even without tenant
    let templateWhere: any = {
      id: id
    };
    
    if (req.tenant) {
      templateWhere.OR = [
        { tenantId: req.tenant.id },
        { isGlobal: true }
      ];
    } else if (isDevMode) {
      // In dev mode without tenant, only get global templates
      templateWhere.isGlobal = true;
    } else {
      return res.status(400).json({ 
        error: 'Tenant required',
        message: 'Please select a tenant to use this template'
      })
    }
    
    const template = await prisma.template.findFirst({
      where: templateWhere
    })

    if (!template) {
      return res.status(404).json({ 
        error: 'Template not found',
        message: 'Template does not exist or you do not have access to it'
      })
    }

    // Increment usage count
    await prisma.template.update({
      where: { id: id },
      data: { usageCount: { increment: 1 } }
    })

    // Generate document content from template
    let documentContent = template.content;
    
    // Add default placeholders for createdDate and updatedDate
    const now = new Date().toLocaleString('de-DE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    documentContent = documentContent.replace(/\{\{createdDate\}\}/g, now);
    documentContent = documentContent.replace(/\{\{updatedDate\}\}/g, now);
    documentContent = documentContent.replace(/\{\{version\}\}/g, '1.0');
    
    // If customFields provided, replace placeholders in template
    if (customFields && typeof customFields === 'object') {
      Object.entries(customFields).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        documentContent = documentContent.replace(new RegExp(placeholder, 'g'), String(value || ''));
      });
    }
    
    // Replace all remaining placeholders with empty strings or placeholder text
    // This ensures the document looks professional even if not all fields are filled
    documentContent = documentContent.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      // Keep some structural placeholders, but replace others with empty or helpful text
      const structuralPlaceholders = ['createdDate', 'updatedDate', 'version'];
      if (structuralPlaceholders.includes(key)) {
        return match; // Keep if not replaced above
      }
      return '<span class="placeholder-text" style="color: #9ca3af; font-style: italic;">[Bitte ausfüllen]</span>';
    });

    // Use template title if no title provided
    const documentTitle = title || template.name;

    // Determine tenant ID - use req.tenant.id if available, otherwise null (for dev mode)
    const tenantId = req.tenant?.id || null;

    // Create document from template
    const document = await prisma.document.create({
      data: {
        title: documentTitle,
        content: documentContent,
        category: template.category,
        tenantId: tenantId,
        userId: req.user.id,
        status: 'DRAFT',
      }
    })

    res.status(201).json(document)
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ 
      error: 'Failed to create document from template',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

// Seed templates if empty (creates global templates with state-of-the-art content)
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const { force = false } = req.body || {}
    
    // Prüfe ob Templates existieren
    const existingTemplates = await prisma.template.findMany({
      where: { isGlobal: true },
      select: { id: true, name: true }
    })
    
    if (existingTemplates.length > 0 && !force) {
      return res.json({ 
        message: 'Global templates already exist',
        count: existingTemplates.length,
        existingTemplates: existingTemplates.map(t => ({ id: t.id, name: t.name })),
        info: 'Send { "force": true } in body to replace existing templates'
      })
    }
    
    // Wenn force=true, lösche bestehende globale Templates
    if (force && existingTemplates.length > 0) {
      await prisma.template.deleteMany({
        where: { isGlobal: true }
      })
      console.log(`[Templates] Deleted ${existingTemplates.length} existing global templates`)
    }
    
    // Use state-of-the-art template definitions
    const templates = stateOfTheArtTemplates.map(template => ({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      structure: JSON.stringify(template.structure),
      isGlobal: template.isGlobal,
      isNistCompliant: template.isNistCompliant,
      nistFramework: template.nistFramework || null,
      tags: JSON.stringify(template.tags)
    }))
    
    await prisma.template.createMany({ data: templates })
    
    res.json({ 
      message: 'State-of-the-art templates seeded successfully', 
      count: templates.length,
      templates: templates.map(t => ({ name: t.name, nistCompliant: t.isNistCompliant }))
    })
  } catch (error: any) {
    console.error('[Templates] Error:', error)
    res.status(500).json({ 
      error: 'Failed to seed templates',
      message: error.message || 'An unexpected error occurred'
    })
  }
})

export default router