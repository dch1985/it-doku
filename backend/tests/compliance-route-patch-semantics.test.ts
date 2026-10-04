import test from 'node:test';
import assert from 'node:assert/strict';
import type { RequestHandler } from 'express';
import complianceRouter from '../src/routes/compliance.js';
import { complianceService } from '../src/services/compliance.service.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
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

function getRouteHandler(path: string, method: 'patch'): RequestHandler {
  const layer = (complianceRouter as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as RequestHandler;
}

test('PATCH /reviews/:id does not clear comments when comments field is omitted', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const service = complianceService as any;
  const originalUpdateReviewRequest = service.updateReviewRequest;

  let capturedPayload: any = null;
  service.updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      tenant: { id: 'tenant-a' },
      body: { status: 'approved' },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.status, 'APPROVED');
    assert.equal(capturedPayload.comments, undefined);
    assert.equal(capturedPayload.tenantId, 'tenant-a');
  } finally {
    service.updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id still allows explicit comment clearing', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const service = complianceService as any;
  const originalUpdateReviewRequest = service.updateReviewRequest;

  let capturedPayload: any = null;
  service.updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      tenant: { id: 'tenant-a' },
      body: { comments: null },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.comments, null);
  } finally {
    service.updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /quality/findings/:id keeps resolution unchanged when omitted', async () => {
  const handler = getRouteHandler('/quality/findings/:id', 'patch');
  const service = complianceService as any;
  const originalUpdateQualityFinding = service.updateQualityFinding;

  let capturedPayload: any = null;
  service.updateQualityFinding = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'finding-1' };
  };

  try {
    const req = {
      params: { id: 'finding-1' },
      body: { action: 'REOPEN' },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.action, 'REOPEN');
    assert.equal(capturedPayload.resolution, undefined);
  } finally {
    service.updateQualityFinding = originalUpdateQualityFinding;
  }
});
