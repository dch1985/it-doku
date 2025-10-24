import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get all documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    res.json(documents)
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

// Get single document
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
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
    const { title, content, category } = req.body
    
    const document = await prisma.document.create({
      data: {
        title,
        content: content || '',
        category,
        size: '0 KB',
        status: 'Draft'
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
    const { id } = req.params
    const { title, content, category, status } = req.body
    
    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        category,
        status
      }
    })
    
    // Create version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        content,
        version: `v1.${await prisma.documentVersion.count({ where: { documentId: document.id } })}`,
        changes: 'Document updated',
        createdBy: 'Driss Chaouat'
      }
    })
    
    res.json(document)
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to update document' })
  }
})

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    await prisma.document.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(204).send()
  } catch (error) {
    console.error('[Documents] Error:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

export default router