import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, images and text files are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Upload file
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { documentId } = req.body

    if (!documentId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: 'Document ID required' })
    }

    const attachment = await prisma.attachment.create({
      data: {
        documentId: parseInt(documentId),
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      }
    })

    res.status(201).json(attachment)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    
    // Clean up file if database save failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (e) {
        console.error('Failed to clean up file:', e)
      }
    }
    
    res.status(500).json({ error: error.message })
  }
})

// Get attachments for document
router.get('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params
    
    const attachments = await prisma.attachment.findMany({
      where: { documentId: parseInt(documentId) },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(attachments)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Download attachment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }
    
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ error: 'File not found on disk' })
    }
    
    res.download(attachment.path, attachment.originalName)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete attachment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }
    
    // Delete file from disk
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path)
    }
    
    // Delete from database
    await prisma.attachment.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(204).send()
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router