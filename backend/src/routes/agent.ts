import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { SKILLS, executeSkill, getSkill, serializeRun } from '../agent/skills.js'

const router = Router()

/** Catalog of agent skills with their descriptions and inputs. */
router.get('/skills', (_req: Request, res: Response) => {
  res.json(
    SKILLS.map(({ id, name, description, writes, inputs }) => ({ id, name, description, writes, inputs }))
  )
})

/** Execute a skill. The agent inspects, decides and acts autonomously. */
router.post('/skills/:id/run', async (req: Request, res: Response) => {
  const skill = getSkill(req.params.id)
  if (!skill) return res.status(404).json({ error: 'Unknown skill' })
  try {
    const run = await executeSkill(skill.id, req.body ?? {})
    res.status(201).json(serializeRun(run))
  } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : 'Skill execution failed' })
  }
})

router.get('/runs', async (_req: Request, res: Response) => {
  const runs = await prisma.agentRun.findMany({ orderBy: { createdAt: 'desc' }, take: 30 })
  res.json(runs.map(serializeRun))
})

router.get('/runs/:id', async (req: Request, res: Response) => {
  const run = await prisma.agentRun.findUnique({ where: { id: req.params.id } })
  if (!run) return res.status(404).json({ error: 'Run not found' })
  res.json(serializeRun(run))
})

export default router
