import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { automationService } from '../services/automation.service.js';

type CreateConnectorBody = {
  name: string;
  type: string;
  config?: Record<string, unknown>;
};

type CreateJobBody = {
  intent?: string;
  documentId?: string;
  connectorId?: string;
  payload?: Record<string, unknown>;
  title?: string;
};

type UpdateSuggestionBody = {
  status: string;
  resolution?: string;
};

const router = Router();
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';

router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

router.get('/connectors', async (req: Request, res: Response) => {
  try {
    const connectors = await automationService.listConnectors(req.tenant?.id);

    res.json(connectors);
  } catch (error: any) {
    console.error('[Automation] Failed to load connectors', error);
    res.status(500).json({
      error: 'Failed to load connectors',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/connectors', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateConnectorBody;
    if (!body?.name || !body?.type) {
      throw new ApplicationError('Name und Typ sind erforderlich', 400);
    }

    const connector = await automationService.createConnector(req.tenant?.id, {
      name: body.name,
      type: body.type,
      config: body.config,
    });

    res.status(201).json(connector);
  } catch (error: any) {
    console.error('[Automation] Failed to create connector', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create connector',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await automationService.listJobs(req.tenant?.id);

    res.json(jobs);
  } catch (error: any) {
    console.error('[Automation] Failed to load jobs', error);
    res.status(500).json({
      error: 'Failed to load jobs',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateJobBody;
    const job = await automationService.createJob(req.tenant?.id, req.user?.id, {
      intent: body.intent,
      documentId: body.documentId,
      connectorId: body.connectorId,
      payload: body.payload,
      title: body.title,
    });

    res.status(201).json(job);
  } catch (error: any) {
    console.error('[Automation] Failed to create job', error);
    res.status(500).json({
      error: 'Failed to create job',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await automationService.getJobWithDetails(req.params.id);

    if (!job || job.tenantId !== req.tenant?.id) {
      return res.status(404).json({ error: 'Job nicht gefunden' });
    }

    res.json(job);
  } catch (error: any) {
    console.error('[Automation] Failed to load job detail', error);
    res.status(500).json({
      error: 'Failed to load job detail',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/jobs/:id/approve', async (req: Request, res: Response) => {
  try {
    const job = await automationService.approveJob(req.params.id);

    res.json(job);
  } catch (error: any) {
    console.error('[Automation] Failed to approve job', error);
    res.status(500).json({
      error: 'Failed to approve job',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = await automationService.listSuggestions(req.tenant?.id);

    res.json(suggestions);
  } catch (error: any) {
    console.error('[Automation] Failed to load suggestions', error);
    res.status(500).json({
      error: 'Failed to load suggestions',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.patch('/suggestions/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateSuggestionBody;
    const suggestion = await automationService.updateSuggestion(req.params.id, {
      status: body.status,
      resolution: body.resolution,
    });

    res.json(suggestion);
  } catch (error: any) {
    console.error('[Automation] Failed to update suggestion', error);
    res.status(500).json({
      error: 'Failed to update suggestion',
      message: error.message ?? 'Unexpected error',
    });
  }
});

export default router;
