import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { assistantService } from '../services/assistant.service.js';

const router = Router();
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';

router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const conversations = await assistantService.listConversations(req.tenant?.id ?? undefined, req.user?.id ?? undefined);

    res.json(conversations);
  } catch (error: any) {
    console.error('[Assistant] Failed to load conversations', error);
    res.status(500).json({
      error: 'Failed to load conversations',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body ?? {};
    if (!question) {
      throw new ApplicationError('Eine Frage wird benötigt', 400);
    }

    const response = await assistantService.answerQuestion({
      question,
      audience: req.body?.audience,
      conversationId: req.body?.conversationId,
      title: req.body?.title,
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
    });

    res.json(response);
  } catch (error: any) {
    console.error('[Assistant] Failed to process query', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to process query',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/traces', async (req: Request, res: Response) => {
  try {
    const traces = await assistantService.listTraces(req.tenant?.id ?? null);

    res.json(traces);
  } catch (error: any) {
    console.error('[Assistant] Failed to load traces', error);
    res.status(500).json({
      error: 'Failed to load traces',
      message: error.message ?? 'Unexpected error',
    });
  }
});

export default router;
