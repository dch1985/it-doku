import test from 'node:test';
import assert from 'node:assert/strict';
import complianceRouter from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createResponse(): MockResponse {
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

function getReviewPatchHandler() {
  const layer = (complianceRouter as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );

  assert.ok(layer, 'Expected /reviews/:id PATCH route to exist');
  return layer.route.stack[0].handle as (req: any, res: any) => Promise<void>;
}

test('PATCH /compliance/reviews/:id does not clear comments when omitted', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdate = complianceService.updateReviewRequest;
  let receivedPayload: any = null;

  complianceService.updateReviewRequest = (async (_id: string, payload: any) => {
    receivedPayload = payload;
    return { id: 'review-1' } as any;
  }) as typeof complianceService.updateReviewRequest;

  const req = {
    params: { id: 'review-1' },
    body: { status: 'APPROVED' },
    tenant: { id: 'tenant-1' },
    user: { id: 'reviewer-1' },
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(receivedPayload.comments, undefined);
  } finally {
    complianceService.updateReviewRequest = originalUpdate;
  }
});

test('PATCH /compliance/reviews/:id rejects unauthenticated requests', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdate = complianceService.updateReviewRequest;
  let called = false;

  complianceService.updateReviewRequest = (async () => {
    called = true;
    return { id: 'review-1' } as any;
  }) as typeof complianceService.updateReviewRequest;

  const req = {
    params: { id: 'review-1' },
    body: { status: 'APPROVED' },
    tenant: { id: 'tenant-1' },
    user: undefined,
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(called, false);
  } finally {
    complianceService.updateReviewRequest = originalUpdate;
  }
});
