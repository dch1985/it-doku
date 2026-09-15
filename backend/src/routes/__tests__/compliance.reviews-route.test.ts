import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../compliance.js';
import { complianceService } from '../../services/compliance.service.js';

type ExpressLikeResponse = {
  statusCode: number;
  payload?: unknown;
  status: (code: number) => ExpressLikeResponse;
  json: (value: unknown) => ExpressLikeResponse;
};

function getPatchReviewHandler() {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );

  if (!layer) {
    throw new Error('PATCH /reviews/:id route not found');
  }

  return layer.route.stack[0].handle as (req: any, res: ExpressLikeResponse) => Promise<void>;
}

async function invokePatchHandler(body: unknown) {
  const handler = getPatchReviewHandler();

  let statusCode = 200;
  let payload: unknown;
  const res: ExpressLikeResponse = {
    statusCode,
    status(code: number) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      payload = value;
      this.payload = value;
      return this;
    },
  };

  const req = {
    body,
    params: { id: 'review-123' },
    tenant: { id: 'tenant-abc' },
  };

  await handler(req, res);
  return { statusCode, payload };
}

test('status-only review updates do not overwrite comments', async () => {
  const original = complianceService.updateReviewRequest;
  const calls: Array<{ id: string; payload: Record<string, unknown> }> = [];

  (complianceService as any).updateReviewRequest = async (
    id: string,
    payload: Record<string, unknown>,
  ) => {
    calls.push({ id, payload });
    return { id, ...payload };
  };

  try {
    const response = await invokePatchHandler({ status: 'approved' });

    assert.equal(response.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      id: 'review-123',
      payload: {
        status: 'APPROVED',
        tenantId: 'tenant-abc',
      },
    });
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});

test('explicit null comments still clear the stored comment', async () => {
  const original = complianceService.updateReviewRequest;
  const calls: Array<{ id: string; payload: Record<string, unknown> }> = [];

  (complianceService as any).updateReviewRequest = async (
    id: string,
    payload: Record<string, unknown>,
  ) => {
    calls.push({ id, payload });
    return { id, ...payload };
  };

  try {
    const response = await invokePatchHandler({ status: 'CHANGES_REQUESTED', comments: null });

    assert.equal(response.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      id: 'review-123',
      payload: {
        status: 'CHANGES_REQUESTED',
        comments: null,
        tenantId: 'tenant-abc',
      },
    });
  } finally {
    (complianceService as any).updateReviewRequest = original;
  }
});
