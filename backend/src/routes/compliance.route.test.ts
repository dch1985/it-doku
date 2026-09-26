import assert from 'node:assert/strict';
import test from 'node:test';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type ReviewUpdatePayload = Parameters<typeof complianceService.updateReviewRequest>[1];
type RouteHandler = (req: any, res: any) => Promise<void>;

function getReviewPatchHandler(): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );

  if (!layer?.route?.stack?.[0]?.handle) {
    throw new Error('PATCH /reviews/:id handler not found');
  }

  return layer.route.stack[0].handle as RouteHandler;
}

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    payload: undefined as unknown,
  };

  response.status = (code: number) => {
    response.statusCode = code;
    return response;
  };

  response.json = (payload: unknown) => {
    response.payload = payload;
    return response;
  };

  return response;
}

test('PATCH /reviews/:id keeps comments unchanged when omitted', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: ReviewUpdatePayload | undefined;

  try {
    (complianceService as any).updateReviewRequest = async (_id: string, payload: ReviewUpdatePayload) => {
      capturedPayload = payload;
      return { id: 'review-1' };
    };

    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      tenant: { id: 'tenant-1' },
    } as any;
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, undefined);
    assert.equal(capturedPayload?.tenantId, 'tenant-1');
    assert.equal(res.statusCode, 200);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id passes explicit null comments to clear them', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: ReviewUpdatePayload | undefined;

  try {
    (complianceService as any).updateReviewRequest = async (_id: string, payload: ReviewUpdatePayload) => {
      capturedPayload = payload;
      return { id: 'review-2' };
    };

    const req = {
      params: { id: 'review-2' },
      body: { status: 'rejected', comments: null },
      tenant: { id: 'tenant-1' },
    } as any;
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(capturedPayload?.status, 'REJECTED');
    assert.equal(capturedPayload?.comments, null);
    assert.equal(res.statusCode, 200);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
