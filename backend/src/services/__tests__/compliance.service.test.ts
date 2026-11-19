import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';
import { complianceService } from '../compliance.service.js';

type ReviewRequestDelegateMock = {
  findUnique: (args: unknown) => Promise<any>;
  update: (args: any) => Promise<any>;
};

const originalReviewRequest = (prisma as any).reviewRequest;

afterEach(() => {
  (prisma as any).reviewRequest = originalReviewRequest;
});

test('rejects review updates from non-reviewers', async () => {
  let updateCalled = false;

  (prisma as any).reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => {
      updateCalled = true;
      return {};
    },
  } satisfies ReviewRequestDelegateMock;

  await assert.rejects(
    complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorUserId: 'attacker-1',
    }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      assert.match((error as Error).message, /zugewiesene Reviewer/);
      return true;
    },
  );

  assert.equal(updateCalled, false);
});

test('allows assigned reviewer to update review status', async () => {
  let updatePayload: any = null;

  (prisma as any).reviewRequest = {
    findUnique: async () => ({
      id: 'review-2',
      reviewerId: 'reviewer-2',
      document: { tenantId: 'tenant-1' },
    }),
    update: async (args: any) => {
      updatePayload = args;
      return {
        id: 'review-2',
        status: args.data.status,
        comments: args.data.comments,
      };
    },
  } satisfies ReviewRequestDelegateMock;

  const updated = await complianceService.updateReviewRequest('review-2', {
    status: 'CHANGES_REQUESTED',
    comments: 'Bitte ergänzen',
    tenantId: 'tenant-1',
    actorUserId: 'reviewer-2',
  });

  assert.equal(updated.status, 'CHANGES_REQUESTED');
  assert.equal(updated.comments, 'Bitte ergänzen');
  assert.equal(updatePayload.where.id, 'review-2');
  assert.equal(updatePayload.data.status, 'CHANGES_REQUESTED');
  assert.ok(updatePayload.data.reviewedAt instanceof Date);
});
