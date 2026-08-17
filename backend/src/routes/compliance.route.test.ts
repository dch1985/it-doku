import assert from 'node:assert/strict';
import test from 'node:test';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type Handler = (req: any, res: any) => Promise<void> | void;

function getPatchReviewHandler(): Handler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch
  );

  if (!layer) {
    throw new Error('PATCH /reviews/:id route handler not found');
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as Handler;
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: null as unknown,
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

test('PATCH /reviews/:id keeps existing comments when omitted', async () => {
  const handler = getPatchReviewHandler();
  const req = {
    params: { id: 'review-1' },
    body: { status: 'approved' },
    tenant: { id: 'tenant-1' },
  };
  const res = createMockResponse();

  let capturedPayload: Record<string, unknown> | undefined;
  const original = complianceService.updateReviewRequest;
  (complianceService as any).updateReviewRequest = async (id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id, ...payload };
  };

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, undefined);
    assert.equal(capturedPayload?.tenantId, 'tenant-1');
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});

test('PATCH /reviews/:id clears comments only when explicitly requested', async () => {
  const handler = getPatchReviewHandler();
  const req = {
    params: { id: 'review-2' },
    body: { status: 'REJECTED', comments: null },
    tenant: { id: 'tenant-2' },
  };
  const res = createMockResponse();

  let capturedPayload: Record<string, unknown> | undefined;
  const original = complianceService.updateReviewRequest;
  (complianceService as any).updateReviewRequest = async (id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id, ...payload };
  };

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload?.status, 'REJECTED');
    assert.equal(capturedPayload?.comments, null);
    assert.equal(capturedPayload?.tenantId, 'tenant-2');
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});
