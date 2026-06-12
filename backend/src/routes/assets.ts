import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { ASSET_TYPES } from '../agent/knowledge.js'

const router = Router()

const assetInput = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(ASSET_TYPES).default('SERVER'),
  hostname: z.string().trim().max(255).nullable().optional(),
  ipAddress: z.string().trim().max(64).nullable().optional(),
  os: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  owner: z.string().trim().max(120).nullable().optional(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).default('ACTIVE'),
  notes: z.string().max(2000).nullable().optional(),
})

router.get('/', async (req: Request, res: Response) => {
  const { type, q } = req.query
  const assets = await prisma.asset.findMany({
    where: {
      ...(typeof type === 'string' && type ? { type } : {}),
      ...(typeof q === 'string' && q ? { name: { contains: q } } : {}),
    },
    include: { documents: { select: { id: true, title: true, category: true, status: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(assets)
})

router.get('/:id', async (req: Request, res: Response) => {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id },
    include: { documents: { select: { id: true, title: true, category: true, status: true, updatedAt: true } } },
  })
  if (!asset) return res.status(404).json({ error: 'Asset not found' })
  res.json(asset)
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = assetInput.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }
  const asset = await prisma.asset.create({ data: parsed.data })
  res.status(201).json(asset)
})

router.put('/:id', async (req: Request, res: Response) => {
  const parsed = assetInput.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues })
  }
  const existing = await prisma.asset.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Asset not found' })
  const asset = await prisma.asset.update({ where: { id: req.params.id }, data: parsed.data })
  res.json(asset)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.asset.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Asset not found' })
  await prisma.asset.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
