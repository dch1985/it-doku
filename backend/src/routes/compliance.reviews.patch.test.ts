import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type JsonResponse = Response & {
  body?: unknown;
  statusCode: number;
};

function getReviewPatchHandler() {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route.methods.patch,
  );
  assert.ok(layer?.route, 'Could not locate PATCH /reviews/:id route');
  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: Request,
    res: Response,
  ) => Promise<void>;
}

function createResponseMock() {
  const response = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as JsonResponse;

  return response;
}

test('PATCH /reviews/:id keeps existing comments when comments is omitted', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: _id };
  };

  try {
    const req = {
      body: { status: 'approved' },
      params: { id: 'review-1' },
      tenant: { id: 'tenant-1' },
    } as unknown as Request;
    const res = createResponseMock();

    await handler(req, res as Response);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: undefined,
      tenantId: 'tenant-1',
    });
  } finally {
    complianceService.updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id clears comments only when explicit null is provided', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: _id };
  };

  try {
    const req = {
      body: { status: 'APPROVED', comments: null },
      params: { id: 'review-2' },
      tenant: { id: 'tenant-2' },
    } as unknown as Request;
    const res = createResponseMock();

    await handler(req, res as Response);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: null,
      tenantId: 'tenant-2',
    });
  } finally {
    complianceService.updateReviewRequest = originalUpdateReviewRequest;
  }
});
