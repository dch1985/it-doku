import { Router, Request, Response } from 'express'
import multer from 'multer'
import { BlobServiceClient } from '@azure/storage-blob'
import { prisma } from '../lib/prisma.js'
import path from 'path'

const router = Router()

// Azure Blob Storage Setup
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads'

if (!connectionString) {
  console.error('⚠️ AZURE_STORAGE_CONNECTION_STRING not configured!')
}

// Multer memory storage (no disk)
const storage = multer.memoryStorage()

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

// Upload file to Azure Blob Storage
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { documentId } = req.body

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID required' })
    }

    if (!connectionString) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    // Generate unique blob name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const blobName = uniqueSuffix + path.extname(req.file.originalname)

    // Upload to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype
      }
    })

    const blobUrl = blockBlobClient.url

    // Save to database
    const attachment = await prisma.attachment.create({
      data: {
        documentId: parseInt(documentId),
        filename: blobName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: blobUrl
      }
    })

    console.log(`[Upload] File uploaded to Azure Blob: ${blobName}`)
    res.status(201).json(attachment)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
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

// Download attachment from Azure Blob
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    if (!connectionString) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    // Download from Azure Blob
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(attachment.filename)

    const downloadResponse = await blockBlobClient.download()
    
    if (!downloadResponse.readableStreamBody) {
      return res.status(404).json({ error: 'File not found in storage' })
    }

    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`)
    
    downloadResponse.readableStreamBody.pipe(res)
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete attachment from Azure Blob
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    if (!connectionString) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    // Delete from Azure Blob
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(attachment.filename)
    
    await blockBlobClient.deleteIfExists()

    // Delete from database
    await prisma.attachment.delete({
      where: { id: parseInt(id) }
    })

    console.log(`[Upload] File deleted from Azure Blob: ${attachment.filename}`)
    res.status(204).send()
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router