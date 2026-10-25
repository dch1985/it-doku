import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type PatchReviewHandler = (req: Request, res: Response) => Promise<void>;

type MockResponse = Response & {
  statusCode: number;
  payload: unknown;
};

function getPatchReviewHandler(): PatchReviewHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch
  );

  if (!layer) {
    throw new Error('PATCH /reviews/:id handler not found');
  }

  return layer.route.stack[0].handle as PatchReviewHandler;
}

function createMockResponse(): MockResponse {
  const response: {
    statusCode: number;
    payload: unknown;
    status(code: number): unknown;
    json(payload: unknown): unknown;
  } = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  return response as unknown as MockResponse;
}

const patchReviewHandler = getPatchReviewHandler();

test('PATCH /reviews/:id preserves comments when comments field is omitted', async () => {
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: any;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      tenant: { id: 'tenant-1' },
    } as unknown as Request;
    const res = createMockResponse();

    await patchReviewHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.status, 'APPROVED');
    assert.equal(capturedPayload.comments, undefined);
    assert.equal(capturedPayload.tenantId, 'tenant-1');
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id forwards explicit null comments', async () => {
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: any;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: unknown) => {
    capturedPayload = payload;
    return { id: 'review-1' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved', comments: null },
      tenant: { id: 'tenant-1' },
    } as unknown as Request;
    const res = createMockResponse();

    await patchReviewHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.comments, null);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id rejects non-string comments payloads', async () => {
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let called = false;

  (complianceService as any).updateReviewRequest = async () => {
    called = true;
    return { id: 'review-1' };
  };

  try {
    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved', comments: 42 },
      tenant: { id: 'tenant-1' },
    } as unknown as Request;
    const res = createMockResponse();

    await patchReviewHandler(req, res);

    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.payload, {
      error: 'Failed to update review request',
      message: 'comments muss ein String oder null sein',
    });
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
