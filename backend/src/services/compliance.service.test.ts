import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

const prismaClient = prisma as any;
const originalReviewRequestDelegate = prismaClient.reviewRequest;

afterEach(() => {
  prismaClient.reviewRequest = originalReviewRequestDelegate;
});

test('updateReviewRequest rejects actors that are not the assigned reviewer', async () => {
  const reviewRequestDelegate: any = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => ({}),
  };
  prismaClient.reviewRequest = reviewRequestDelegate;

  let updateCalled = false;
  reviewRequestDelegate.update = async () => {
    updateCalled = true;
    return {};
  };

  await assert.rejects(
    () =>
      complianceService.updateReviewRequest('review-1', {
        status: 'APPROVED',
        tenantId: 'tenant-1',
        actorId: 'intruder-1',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      assert.match(error.message, /Reviewer/);
      return true;
    },
  );

  assert.equal(updateCalled, false);
});

test('updateReviewRequest keeps stored comments untouched when comments is omitted', async () => {
  const reviewRequestDelegate: any = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => ({}),
  };
  prismaClient.reviewRequest = reviewRequestDelegate;

  let receivedUpdateArgs: any = null;
  reviewRequestDelegate.update = async (args: any) => {
    receivedUpdateArgs = args;
    return {
      id: 'review-1',
      status: 'APPROVED',
      comments: 'existing-comment',
    };
  };

  await complianceService.updateReviewRequest('review-1', {
    status: 'APPROVED',
    tenantId: 'tenant-1',
    actorId: 'reviewer-1',
  });

  assert.ok(receivedUpdateArgs);
  assert.equal(receivedUpdateArgs.where.id, 'review-1');
  assert.equal(receivedUpdateArgs.data.status, 'APPROVED');
  assert.ok(receivedUpdateArgs.data.reviewedAt instanceof Date);
  assert.equal(
    Object.prototype.hasOwnProperty.call(receivedUpdateArgs.data, 'comments'),
    false,
  );
});
