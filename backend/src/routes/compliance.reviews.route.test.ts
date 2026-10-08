import assert from 'node:assert/strict';
import test from 'node:test';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type JsonPayload = { [key: string]: unknown } | undefined;

function getPatchReviewHandler() {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );
  if (!layer) {
    throw new Error('PATCH /reviews/:id route handler not found');
  }
  return layer.route.stack[0].handle as (req: any, res: any) => Promise<void>;
}

function createMockResponse() {
  const result: { statusCode: number; payload: JsonPayload } = { statusCode: 200, payload: undefined };
  const res = {
    status(code: number) {
      result.statusCode = code;
      return res;
    },
    json(payload: JsonPayload) {
      result.payload = payload;
      return res;
    },
  };
  return { res, result };
}

test('PATCH /reviews/:id omits comments when comments field is not provided', async () => {
  const handler = getPatchReviewHandler();
  const original = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | null = null;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const { res, result } = createMockResponse();
    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      user: { id: 'reviewer-1' },
      tenant: { id: 'tenant-1' },
    };

    await handler(req, res);

    assert.equal(result.statusCode, 200);
    assert.ok(capturedPayload, 'expected route to call complianceService.updateReviewRequest');
    const payload = capturedPayload as Record<string, unknown>;
    assert.equal(payload.actorId, 'reviewer-1');
    assert.equal(payload.status, 'APPROVED');
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), false);
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});

test('PATCH /reviews/:id keeps explicit null comments for intentional clears', async () => {
  const handler = getPatchReviewHandler();
  const original = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | null = null;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const { res, result } = createMockResponse();
    const req = {
      params: { id: 'review-1' },
      body: { status: 'APPROVED', comments: null },
      user: { id: 'reviewer-1' },
      tenant: { id: 'tenant-1' },
    };

    await handler(req, res);

    assert.equal(result.statusCode, 200);
    assert.ok(capturedPayload, 'expected route to call complianceService.updateReviewRequest');
    const payload = capturedPayload as Record<string, unknown>;
    assert.equal(payload.comments, null);
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});

test('PATCH /reviews/:id rejects unauthenticated actors before calling service', async () => {
  const handler = getPatchReviewHandler();
  const original = complianceService.updateReviewRequest;
  const originalConsoleError = console.error;
  let called = false;

  (complianceService as any).updateReviewRequest = async () => {
    called = true;
    return { id: 'review-1' };
  };
  console.error = () => {};

  try {
    const { res, result } = createMockResponse();
    const req = {
      params: { id: 'review-1' },
      body: { status: 'APPROVED' },
      user: undefined,
      tenant: { id: 'tenant-1' },
    };

    await handler(req, res);

    assert.equal(called, false);
    assert.equal(result.statusCode, 403);
    assert.equal(result.payload?.error, 'Failed to update review request');
  } finally {
    (complianceService as any).updateReviewRequest = original;
    console.error = originalConsoleError;
  }
});
