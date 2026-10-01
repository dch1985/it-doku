import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

const originalReviewRequestDelegate = (prisma as any).reviewRequest;

async function run() {
  let updateInvocations = 0;

  (prisma as any).reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async ({ data }: { data: Record<string, unknown> }) => {
      updateInvocations += 1;
      return {
        id: 'review-1',
        ...data,
      };
    },
  };

  await assert.rejects(
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

  assert.equal(updateInvocations, 0, 'Unauthorized users must not update review requests');

  const updated = await complianceService.updateReviewRequest('review-1', {
    status: 'APPROVED',
    tenantId: 'tenant-1',
    actorUserId: 'reviewer-1',
  });

  assert.equal(updateInvocations, 1, 'Assigned reviewer should be allowed to update review requests');
  assert.equal(updated.id, 'review-1');
  assert.equal(updated.status, 'APPROVED');
}

run()
  .then(() => {
    console.log('compliance.review-auth.test passed');
  })
  .catch((error) => {
    console.error('compliance.review-auth.test failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    (prisma as any).reviewRequest = originalReviewRequestDelegate;
  });
