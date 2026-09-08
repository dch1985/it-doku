import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';
import { complianceService } from '../src/services/compliance.service.js';

type MockReviewRequest = {
  id: string;
  reviewerId: string;
  requestedBy: string;
  document: {
    tenantId: string | null;
  } | null;
};

type ReviewRequestDelegate = {
  findUnique: (...args: unknown[]) => Promise<MockReviewRequest | null>;
  update: (...args: unknown[]) => Promise<unknown>;
};

function withMockedReviewRequestDelegate(delegate: ReviewRequestDelegate) {
  const prismaAny = prisma as unknown as { reviewRequest?: ReviewRequestDelegate };
  const original = prismaAny.reviewRequest;
  prismaAny.reviewRequest = delegate;
  return () => {
    prismaAny.reviewRequest = original;
  };
}

test('rejects review updates from non-reviewer actors', async () => {
  let updateCalled = false;
  const restore = withMockedReviewRequestDelegate({
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      requestedBy: 'requester-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => {
      updateCalled = true;
      return {};
    },
  });

  try {
    await assert.rejects(
      () =>
        complianceService.updateReviewRequest('review-1', {
          status: 'APPROVED',
          tenantId: 'tenant-1',
          actorId: 'intruder-1',
          actorRole: 'USER',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        assert.match(error.message, /Reviewer/);
        return true;
      },
    );
    assert.equal(updateCalled, false, 'update should not run when actor is unauthorized');
  } finally {
    restore();
  }
});

test('allows reviewer to update status without clearing comments implicitly', async () => {
  let capturedData: Record<string, unknown> | null = null;
  const restore = withMockedReviewRequestDelegate({
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      requestedBy: 'requester-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async (args: unknown) => {
      const payload = args as { data?: Record<string, unknown> };
      capturedData = payload.data ?? null;
      return { id: 'review-1', status: 'APPROVED' };
    },
  });

  try {
    await complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorId: 'reviewer-1',
      actorRole: 'USER',
    });

    assert.ok(capturedData, 'update payload should be produced');
    assert.equal(capturedData?.status, 'APPROVED');
    assert.ok(capturedData?.reviewedAt instanceof Date);
    assert.equal(
      Object.prototype.hasOwnProperty.call(capturedData ?? {}, 'comments'),
      false,
      'comments must stay untouched when omitted',
    );
  } finally {
    restore();
  }
});
