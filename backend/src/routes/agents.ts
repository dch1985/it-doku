import { Router, Request, Response } from 'express';
import { listSkills, runAgentSkill } from '../services/agent.service.js';

const router = Router();

router.get('/skills', (_req: Request, res: Response) => {
  res.json({ skills: listSkills() });
});

router.post('/run', async (req: Request, res: Response) => {
  try {
    const { skillId, inputs } = req.body;

    if (!skillId || !inputs) {
      res.status(400).json({ error: 'skillId and inputs are required' });
      return;
    }

    const result = await runAgentSkill({ skillId, inputs });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Agent execution failed' });
  }
});

export default router;
