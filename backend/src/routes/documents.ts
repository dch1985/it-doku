import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { parseJson } from '../lib/json.js'
import { DOCUMENT_CATEGORIES } from '../agent/knowledge.js'

const router = Router()

const STATUSES = ['DRAFT', 'PUBLISHED', 'NEEDS_REVIEW', 'ARCHIVED'] as const

const documentInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().default(''),
  category: z.enum(DOCUMENT_CATEGORIES).default('GENERAL'),
  status: z.enum(STATUSES).default('DRAFT'),
  tags: z.array(z.string().trim().min(1)).default([]),
  assetId: z.string().nullable().optional(),
})

const serialize = (doc: {
  tags: string
  [key: string]: unknown
}) => ({ ...doc, tags: parseJson<string[]>(doc.tags, []) })

router.get('/', async (req: Request, res: Response) => {
  const { category, status, q } = req.query
  const documents = await prisma.document.findMany({
    where: {
      ...(typeof category === 'string' && category ? { category } : {}),
      ...(typeof status === 'string' && status ? { status } : {}),
      ...(typeof q === 'string' && q ? { title: { contains: q } } : {}),
    },
    include: { asset: { select: { id: true, name: true, type: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(documents.map(serialize))
})

router.get('/:id', async (req: Request, res: Response) => {
  const document = await prisma.document.findUnique({
    where: { id: req.params.id },
    include: { asset: { select: { id: true, name: true, type: true } } },
  })
  if (!document) return res.status(404).json({ error: 'Document not found' })
  res.json(serialize(document))
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = documentInput.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }
  const { tags, ...data } = parsed.data
  const document = await prisma.document.create({
    data: { ...data, tags: JSON.stringify(tags) },
    include: { asset: { select: { id: true, name: true, type: true } } },
  })
  res.status(201).json(serialize(document))
})

router.put('/:id', async (req: Request, res: Response) => {
  const parsed = documentInput.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Document not found' })

  const { tags, ...data } = parsed.data
  const contentChanged = data.content !== undefined && data.content !== existing.content
  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      ...(contentChanged ? { version: { increment: 1 } } : {}),
    },
    include: { asset: { select: { id: true, name: true, type: true } } },
  })
  res.json(serialize(document))
})

/** Mark a document as reviewed: resets the freshness clock and publishes it. */
router.post('/:id/review', async (req: Request, res: Response) => {
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Document not found' })
  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: { reviewedAt: new Date(), status: 'PUBLISHED' },
    include: { asset: { select: { id: true, name: true, type: true } } },
  })
  res.json(serialize(document))
})

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.document.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Document not found' })
  await prisma.document.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
