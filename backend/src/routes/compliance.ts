import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from '../services/compliance.service.js';

type UpdateFindingBody = {
  resolution?: string | null;
  action?: 'RESOLVE' | 'REOPEN';
};

type CreateReviewBody = {
  documentId: string;
  reviewerId: string;
  comments?: string | null;
};

type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

const router = Router();
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';

router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

router.get('/schemas', async (req: Request, res: Response) => {
  try {
    const schemas = await complianceService.listTemplateSchemas(req.tenant?.id);

    res.json(schemas);
  } catch (error: any) {
    console.error('[Compliance] Failed to load schemas', error);
    res.status(500).json({
      error: 'Failed to load schemas',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/schemas', async (req: Request, res: Response) => {
  try {
    const { name, description, format, schema, isGlobal } = req.body ?? {};
    if (!name || !schema) {
      throw new ApplicationError('Name und Schema-Daten sind erforderlich', 400);
    }

    const created = await complianceService.createTemplateSchema({
      name: String(name),
      description: description ? String(description) : undefined,
      format: format ? String(format) : undefined,
      schema,
      isGlobal,
      tenantId: req.tenant?.id ?? null,
      actorRole: req.user?.role ?? null,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('[Compliance] Failed to create schema', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create schema',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/annotations', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;
    const annotations = await complianceService.listAnnotations(req.tenant?.id ?? null, documentId ? String(documentId) : undefined);

    res.json(annotations);
  } catch (error: any) {
    console.error('[Compliance] Failed to load annotations', error);
    res.status(500).json({
      error: 'Failed to load annotations',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/annotations', async (req: Request, res: Response) => {
  try {
    const { documentId, key, value, location } = req.body ?? {};
    if (!documentId || !key || typeof value === 'undefined') {
      throw new ApplicationError('documentId, key und value sind erforderlich', 400);
    }

    const annotation = await complianceService.createAnnotation({
      documentId: String(documentId),
      key: String(key),
      value,
      location: location ? String(location) : undefined,
      tenantId: req.tenant?.id ?? null,
    });

    res.status(201).json(annotation);
  } catch (error: any) {
    console.error('[Compliance] Failed to create annotation', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create annotation',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/trace-links', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;
    const links = await complianceService.listTraceLinks(
      req.tenant?.id ?? null,
      documentId ? String(documentId) : undefined,
    );

    res.json(links);
  } catch (error: any) {
    console.error('[Compliance] Failed to load trace links', error);
    res.status(500).json({
      error: 'Failed to load trace links',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/trace-links', async (req: Request, res: Response) => {
  try {
    const { sourceType, sourceId, targetType, targetId, relationship, metadata } = req.body ?? {};
    if (!sourceType || !sourceId || !targetType || !targetId) {
      throw new ApplicationError('Source und Target Angaben sind erforderlich', 400);
    }

    const link = await complianceService.createTraceLink({
      sourceType: String(sourceType),
      sourceId: String(sourceId),
      targetType: String(targetType),
      targetId: String(targetId),
      relationship: relationship ? String(relationship) : undefined,
      metadata,
      tenantId: req.tenant?.id ?? null,
      sourceDocumentId: req.body.sourceDocumentId ?? null,
      targetDocumentId: req.body.targetDocumentId ?? null,
    });

    res.status(201).json(link);
  } catch (error: any) {
    console.error('[Compliance] Failed to create trace link', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create trace link',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/quality/findings', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;
    const findings = await complianceService.listQualityFindings(documentId ? String(documentId) : undefined);

    res.json(findings);
  } catch (error: any) {
    console.error('[Compliance] Failed to load quality findings', error);
    res.status(500).json({
      error: 'Failed to load quality findings',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.patch('/quality/findings/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateFindingBody;
    const action = body?.action ? body.action.toUpperCase() : undefined;

    if (action && action !== 'RESOLVE' && action !== 'REOPEN') {
      throw new ApplicationError(`Ungültige Aktion: ${action}`, 400);
    }

    const finding = await complianceService.updateQualityFinding(req.params.id, {
      action: action as 'RESOLVE' | 'REOPEN' | undefined,
      resolution: typeof body?.resolution === 'string' ? body.resolution : body?.resolution ?? null,
    });

    res.json(finding);
  } catch (error: any) {
    console.error('[Compliance] Failed to update quality finding', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to update quality finding',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/quality/check', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body ?? {};
    if (!documentId) {
      throw new ApplicationError('documentId ist erforderlich', 400);
    }

    const findings = await complianceService.runQualityChecks(String(documentId));
    res.json({
      documentId: String(documentId),
      findings,
    });
  } catch (error: any) {
    console.error('[Compliance] Failed to run quality checks', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to run quality checks',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;
    const reviews = await complianceService.listReviewRequests(
      req.tenant?.id,
      typeof documentId === 'string' ? documentId : undefined,
    );
    res.json(reviews);
  } catch (error: any) {
    console.error('[Compliance] Failed to load review requests', error);
    res.status(500).json({
      error: 'Failed to load review requests',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateReviewBody;
    if (!body?.documentId || !body?.reviewerId) {
      throw new ApplicationError('documentId und reviewerId sind erforderlich', 400);
    }

    const requesterId = req.user?.id;
    if (!requesterId) {
      throw new ApplicationError('Authentifizierung erforderlich', 403);
    }

    const review = await complianceService.createReviewRequest({
      documentId: String(body.documentId),
      reviewerId: String(body.reviewerId),
      requestedBy: requesterId,
      comments: body.comments ?? null,
      tenantId: req.tenant?.id ?? null,
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('[Compliance] Failed to create review request', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to create review request',
      message: error.message ?? 'Unexpected error',
    });
  }
});

router.patch('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateReviewBody;
    const status = body?.status ? String(body.status).toUpperCase() : undefined;

    const review = await complianceService.updateReviewRequest(req.params.id, {
      status: status as any,
      comments: body?.comments ?? null,
      tenantId: req.tenant?.id ?? null,
    });

    res.json(review);
  } catch (error: any) {
    console.error('[Compliance] Failed to update review request', error);
    res.status(error.statusCode ?? 500).json({
      error: 'Failed to update review request',
      message: error.message ?? 'Unexpected error',
    });
  }
});

export default router;
