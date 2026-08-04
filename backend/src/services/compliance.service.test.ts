import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

type ReviewRecord = {
  id: string;
  reviewerId: string;
  requestedBy: string;
  document: { tenantId: string | null } | null;
};

const baseReview: ReviewRecord = {
  id: 'review-1',
  reviewerId: 'reviewer-1',
  requestedBy: 'requester-1',
  document: { tenantId: 'tenant-1' },
};

test('updateReviewRequest blocks non-reviewers from changing review state', async () => {
  const prismaAny = prisma as any;
  const originalReviewRequest = prismaAny.reviewRequest;
  prismaAny.reviewRequest = prismaAny.reviewRequest ?? {};
  const reviewRequest = prismaAny.reviewRequest;
  const originalFindUnique = reviewRequest.findUnique;
  const originalUpdate = reviewRequest.update;
  let updateCalled = false;

  reviewRequest.findUnique = async () => baseReview;
  reviewRequest.update = async () => {
    updateCalled = true;
    return { id: 'review-1' };
  };

  try {
    await assert.rejects(
      () =>
        complianceService.updateReviewRequest('review-1', {
          status: 'APPROVED',
          tenantId: 'tenant-1',
          actorUserId: 'intruder-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    reviewRequest.findUnique = originalFindUnique;
    reviewRequest.update = originalUpdate;
    prismaAny.reviewRequest = originalReviewRequest;
  }
});

test('updateReviewRequest leaves comments untouched when not provided', async () => {
  const prismaAny = prisma as any;
  const originalReviewRequest = prismaAny.reviewRequest;
  prismaAny.reviewRequest = prismaAny.reviewRequest ?? {};
  const reviewRequest = prismaAny.reviewRequest;
  const originalFindUnique = reviewRequest.findUnique;
  const originalUpdate = reviewRequest.update;
  let updateInput: any = null;

  reviewRequest.findUnique = async () => baseReview;
  reviewRequest.update = async (input: any) => {
    updateInput = input;
    return { id: 'review-1' };
  };

  try {
    await complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorUserId: 'reviewer-1',
    });
    assert.ok(updateInput);
    assert.equal(Object.prototype.hasOwnProperty.call(updateInput.data, 'comments'), false);
  } finally {
    reviewRequest.findUnique = originalFindUnique;
    reviewRequest.update = originalUpdate;
    prismaAny.reviewRequest = originalReviewRequest;
  }
});
