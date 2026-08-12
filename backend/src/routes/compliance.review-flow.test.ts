import test from 'node:test';
import assert from 'node:assert/strict';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

function getReviewPatchHandler() {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );

  if (!layer) {
    throw new Error('PATCH /reviews/:id route handler not found');
  }

  return layer.route.stack[0].handle as (req: any, res: any) => Promise<void>;
}

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.body = payload;
      return response;
    },
  };

  return response;
}

test('PATCH /compliance/reviews/:id preserves comments when field is omitted', async () => {
  const handler = getReviewPatchHandler();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: any;

  complianceService.updateReviewRequest = (async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: 'review-1', status: payload.status ?? 'PENDING' } as any;
  }) as any;

  try {
    const req: any = {
      body: { status: 'approved' },
      params: { id: 'review-1' },
      user: { id: 'reviewer-1' },
      tenant: { id: 'tenant-1' },
      tenantMember: { role: 'MEMBER' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.status, 'APPROVED');
    assert.equal(capturedPayload.actorUserId, 'reviewer-1');
    assert.equal(capturedPayload.actorTenantRole, 'MEMBER');
    assert.equal(capturedPayload.comments, undefined);
  } finally {
    complianceService.updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('updateReviewRequest rejects non-reviewer status updates without admin override', async () => {
  const originalReviewRequestModel = (prisma as any).reviewRequest;
  (prisma as any).reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => {
      throw new Error('update should not be called for unauthorized actor');
    },
  };

  try {
    await assert.rejects(
      () =>
        complianceService.updateReviewRequest('review-1', {
          status: 'APPROVED',
          tenantId: 'tenant-1',
          actorUserId: 'intruder-1',
          actorTenantRole: 'MEMBER',
        }),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        assert.match(error.message, /Reviewer/);
        return true;
      },
    );
  } finally {
    (prisma as any).reviewRequest = originalReviewRequestModel;
  }
});

test('updateReviewRequest keeps existing comments when comments are undefined', async () => {
  const originalReviewRequestModel = (prisma as any).reviewRequest;
  let capturedUpdateData: any;

  (prisma as any).reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async ({ data }: any) => {
      capturedUpdateData = data;
      return { id: 'review-1', ...data };
    },
  };

  try {
    await complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorUserId: 'reviewer-1',
      actorTenantRole: 'MEMBER',
      comments: undefined,
    });

    assert.equal(capturedUpdateData.status, 'APPROVED');
    assert.ok(capturedUpdateData.reviewedAt instanceof Date);
    assert.ok(!Object.prototype.hasOwnProperty.call(capturedUpdateData, 'comments'));
  } finally {
    (prisma as any).reviewRequest = originalReviewRequestModel;
  }
});
