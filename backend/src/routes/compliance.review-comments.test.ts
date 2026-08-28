import assert from 'node:assert/strict';
import test from 'node:test';

import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type ExpressHandler = (req: any, res: any, next?: any) => unknown | Promise<unknown>;

function getRouteHandler(path: string, method: 'patch'): ExpressHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );

  const handler = layer?.route?.stack?.[0]?.handle;
  if (!handler) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }
  return handler as ExpressHandler;
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

test('PATCH /reviews/:id keeps existing comments when comments field is omitted', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;

  let capturedPayload: unknown;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-1', status: 'APPROVED' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      tenant: { id: 'tenant-a' },
      body: { status: 'approved' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: undefined,
      tenantId: 'tenant-a',
    });
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id still allows explicit comment clearing', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;

  let capturedPayload: unknown;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-2', status: 'APPROVED' };
  };

  try {
    const req = {
      params: { id: 'review-2' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPROVED', comments: null },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: null,
      tenantId: 'tenant-a',
    });
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
