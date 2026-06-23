import assert from 'node:assert/strict';
import { test } from 'node:test';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type RouteHandler = (req: any, res: any) => Promise<void>;

function getRouteHandler(path: string, method: 'patch' | 'post' | 'get'): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[0].handle as RouteHandler;
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

test('PATCH /reviews/:id keeps comments unchanged when omitted', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const original = complianceService.updateReviewRequest;
  let capturedPayload: any = null;

  complianceService.updateReviewRequest = (async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: 'review-1', ...payload };
  }) as typeof complianceService.updateReviewRequest;

  try {
    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      tenant: { id: 'tenant-1' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.status, 'APPROVED');
    assert.equal(capturedPayload.tenantId, 'tenant-1');
    assert.equal(capturedPayload.comments, undefined);
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /quality/findings/:id does not inject resolution when absent', async () => {
  const handler = getRouteHandler('/quality/findings/:id', 'patch');
  const original = complianceService.updateQualityFinding;
  let capturedChanges: any = null;

  complianceService.updateQualityFinding = (async (_id: string, changes: any) => {
    capturedChanges = changes;
    return { id: 'finding-1', ...changes };
  }) as typeof complianceService.updateQualityFinding;

  try {
    const req = {
      params: { id: 'finding-1' },
      body: { action: 'resolve' },
      tenant: { id: 'tenant-1' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedChanges.action, 'RESOLVE');
    assert.equal(capturedChanges.resolution, undefined);
  } finally {
    complianceService.updateQualityFinding = original;
  }
});
