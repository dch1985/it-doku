import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

type ReviewRecord = {
  id: string;
  reviewerId: string;
  document: { tenantId: string | null } | null;
};

function buildReview(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    id: 'review-1',
    reviewerId: 'reviewer-1',
    document: { tenantId: 'tenant-1' },
    ...overrides,
  };
}

function getReviewRequestModel() {
  const prismaAny = prisma as any;
  prismaAny.reviewRequest ??= {};
  return prismaAny.reviewRequest as {
    findUnique?: (...args: any[]) => Promise<any>;
    update?: (...args: any[]) => Promise<any>;
  };
}

test('updateReviewRequest rejects status changes from non-reviewers', async () => {
  const reviewRequest = getReviewRequestModel();
  const originalFindUnique = reviewRequest.findUnique;
  const originalUpdate = reviewRequest.update;

  reviewRequest.findUnique = async () => buildReview();
  reviewRequest.update = async () => {
    throw new Error('update must not be called for unauthorized actors');
  };

  try {
    await assert.rejects(
      complianceService.updateReviewRequest('review-1', {
        status: 'APPROVED',
        tenantId: 'tenant-1',
        actorId: 'user-2',
      }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('Reviewer'),
    );
  } finally {
    reviewRequest.findUnique = originalFindUnique;
    reviewRequest.update = originalUpdate;
  }
});

test('updateReviewRequest keeps existing comments when comments is omitted', async () => {
  const reviewRequest = getReviewRequestModel();
  const originalFindUnique = reviewRequest.findUnique;
  const originalUpdate = reviewRequest.update;
  let capturedData: Record<string, unknown> | null = null;

  reviewRequest.findUnique = async () => buildReview();
  reviewRequest.update = async ({ data }: { data: Record<string, unknown> }) => {
    capturedData = data;
    return { id: 'review-1', ...data };
  };

  try {
    await complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorId: 'reviewer-1',
    });

    assert.ok(capturedData, 'expected update payload to be captured');
    const data = capturedData as Record<string, unknown>;
    assert.equal(data.status, 'APPROVED');
    assert.ok(data.reviewedAt instanceof Date);
    assert.equal(Object.prototype.hasOwnProperty.call(data, 'comments'), false);
  } finally {
    reviewRequest.findUnique = originalFindUnique;
    reviewRequest.update = originalUpdate;
  }
});

test('updateReviewRequest clears comments only when explicitly set to null', async () => {
  const reviewRequest = getReviewRequestModel();
  const originalFindUnique = reviewRequest.findUnique;
  const originalUpdate = reviewRequest.update;
  let capturedData: Record<string, unknown> | null = null;

  reviewRequest.findUnique = async () => buildReview();
  reviewRequest.update = async ({ data }: { data: Record<string, unknown> }) => {
    capturedData = data;
    return { id: 'review-1', ...data };
  };

  try {
    await complianceService.updateReviewRequest('review-1', {
      comments: null,
      tenantId: 'tenant-1',
      actorId: 'reviewer-1',
    });

    assert.ok(capturedData, 'expected update payload to be captured');
    const data = capturedData as Record<string, unknown>;
    assert.equal(Object.prototype.hasOwnProperty.call(data, 'comments'), true);
    assert.equal(data.comments, null);
  } finally {
    reviewRequest.findUnique = originalFindUnique;
    reviewRequest.update = originalUpdate;
  }
});
