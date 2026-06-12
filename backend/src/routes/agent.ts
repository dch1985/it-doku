import { Router, Request, Response } from 'express'
import { agentService, AGENT_SKILLS, AgentSkillId } from '../services/agent.service.js'
import { tenantMiddleware } from '../middleware/tenant.middleware.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { devAuthenticate } from '../middleware/auth.dev.middleware.js'

const router = Router()

const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true'
router.use(isDevMode ? devAuthenticate : authenticate)
router.use(tenantMiddleware)

const SKILL_IDS = AGENT_SKILLS.map((s) => s.id)

// GET /api/agent/skills - The agent's capabilities
router.get('/skills', (_req: Request, res: Response) => {
  res.json(agentService.getSkills())
})

// GET /api/agent/runs - Recent runs
router.get('/runs', async (req: Request, res: Response) => {
  try {
    const runs = await agentService.getRuns({ tenantId: req.tenant?.id ?? null })
    res.json(runs)
  } catch (error: any) {
    console.error('[Agent] Error fetching runs:', error)
    res.status(500).json({ error: 'Failed to fetch agent runs', message: error.message })
  }
})

// GET /api/agent/findings?status=OPEN - Findings across runs
router.get('/findings', async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined
    const findings = await agentService.getFindings({ tenantId: req.tenant?.id ?? null }, status)
    res.json(findings)
  } catch (error: any) {
    console.error('[Agent] Error fetching findings:', error)
    res.status(500).json({ error: 'Failed to fetch findings', message: error.message })
  }
})

// POST /api/agent/run { skill } - Execute a skill
router.post('/run', async (req: Request, res: Response) => {
  try {
    const skill = String(req.body?.skill ?? '').toUpperCase() as AgentSkillId
    if (!SKILL_IDS.includes(skill)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `Unknown skill. Must be one of: ${SKILL_IDS.join(', ')}`,
      })
    }

    const run = await agentService.runSkill(skill, {
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
    })
    res.status(201).json(run)
  } catch (error: any) {
    console.error('[Agent] Error running skill:', error)
    res.status(500).json({ error: 'Agent run failed', message: error.message })
  }
})

// POST /api/agent/findings/:id/apply - Approve & execute the proposed action
router.post('/findings/:id/apply', async (req: Request, res: Response) => {
  try {
    const result = await agentService.applyFinding(req.params.id, {
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
    })
    res.json(result)
  } catch (error: any) {
    const status = error.statusCode ?? 500
    if (status >= 500) console.error('[Agent] Error applying finding:', error)
    res.status(status).json({ error: 'Failed to apply finding', message: error.message })
  }
})

// POST /api/agent/findings/:id/dismiss - Reject the finding
router.post('/findings/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const finding = await agentService.dismissFinding(req.params.id, {
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
    })
    res.json(finding)
  } catch (error: any) {
    const status = error.statusCode ?? 500
    if (status >= 500) console.error('[Agent] Error dismissing finding:', error)
    res.status(status).json({ error: 'Failed to dismiss finding', message: error.message })
  }
})

export default router
