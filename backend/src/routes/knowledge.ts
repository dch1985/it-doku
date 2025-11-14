import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { knowledgeService } from '../services/knowledge.service.js';

type CreateKnowledgeBody = {
  content: string;
  type: string;
  documentId?: string | null;
  tags?: string[] | string | null;
  metadata?: Record<string, unknown> | string | null;
  connections?: unknown;
};

type UpdateKnowledgeBody = {
  content?: string;
  type?: string;
  documentId?: string | null;
  tags?: string[] | string | null;
  metadata?: Record<string, unknown> | string | null;
  connections?: unknown;
};

const router = Router();
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';

router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;
    const nodes = await knowledgeService.listNodes(
      req.tenant?.id,
      typeof documentId === 'string' ? documentId : undefined,
    );
    res.json(nodes);
  } catch (error: any) {
    console.error('[Knowledge] Failed to list nodes', error);
    res.status(500).json({
      error: 'Failed to list knowledge nodes',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateKnowledgeBody;
    if (!body?.content || !body?.type) {
      throw new ApplicationError('Content und Typ sind erforderlich', 400);
    }

    const node = await knowledgeService.createNode(req.tenant?.id, body);
    res.status(201).json(node);
  } catch (error: any) {
    console.error('[Knowledge] Failed to create node', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create knowledge node',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateKnowledgeBody;
    const node = await knowledgeService.updateNode(req.params.id, req.tenant?.id, body);
    res.json(node);
  } catch (error: any) {
    console.error('[Knowledge] Failed to update node', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to update knowledge node',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await knowledgeService.deleteNode(req.params.id, req.tenant?.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('[Knowledge] Failed to delete node', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to delete knowledge node',
      message: error.message ?? 'Unexpected error',
    });
  }
});

export default router;

