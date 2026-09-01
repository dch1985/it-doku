import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

function patchPrismaDelegate(delegateName: string, mock: unknown): () => void {
  const prismaAny = prisma as Record<string, unknown>;
  const original = prismaAny[delegateName];
  prismaAny[delegateName] = mock;
  return () => {
    prismaAny[delegateName] = original;
  };
}

test('compliance service tenant/reviewer security guards', async (t) => {
  await t.test('listQualityFindings applies tenant ownership filter', async () => {
    let capturedWhere: Record<string, unknown> | null = null;
    const restoreQualityFinding = patchPrismaDelegate('qualityFinding', {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        capturedWhere = where;
        return [];
      },
    });

    try {
      await complianceService.listQualityFindings('tenant-a', 'doc-1');
      assert.deepEqual(capturedWhere, {
        documentId: 'doc-1',
        OR: [
          { document: { tenantId: 'tenant-a' } },
          { generationJob: { tenantId: 'tenant-a' } },
        ],
      });
    } finally {
      restoreQualityFinding();
    }
  });

  await t.test('updateQualityFinding rejects cross-tenant updates', async () => {
    let updateCalled = false;
    const restoreQualityFinding = patchPrismaDelegate('qualityFinding', {
      findUnique: async () => ({
        id: 'finding-1',
        document: { tenantId: 'tenant-b' },
        generationJob: null,
      }),
      update: async () => {
        updateCalled = true;
        return { id: 'finding-1' };
      },
    });

    try {
      await assert.rejects(
        () => complianceService.updateQualityFinding('finding-1', 'tenant-a', { action: 'RESOLVE' }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 404 &&
          error.message.includes('Quality Finding wurde nicht gefunden'),
      );
      assert.equal(updateCalled, false);
    } finally {
      restoreQualityFinding();
    }
  });

  await t.test('runQualityChecks rejects non-owned document IDs', async () => {
    const restoreDocument = patchPrismaDelegate('document', {
      findFirst: async () => null,
    });

    try {
      await assert.rejects(
        () => complianceService.runQualityChecks('doc-foreign', 'tenant-a'),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 404 &&
          error.message.includes('Dokument nicht gefunden'),
      );
    } finally {
      restoreDocument();
    }
  });

  await t.test('updateReviewRequest rejects non-reviewer actors', async () => {
    let updateCalled = false;
    const restoreReviewRequest = patchPrismaDelegate('reviewRequest', {
      findUnique: async () => ({
        id: 'review-1',
        reviewerId: 'reviewer-1',
        document: { tenantId: 'tenant-a' },
      }),
      update: async () => {
        updateCalled = true;
        return { id: 'review-1' };
      },
    });

    try {
      await assert.rejects(
        () =>
          complianceService.updateReviewRequest('review-1', {
            tenantId: 'tenant-a',
            actorUserId: 'intruder',
            status: 'APPROVED',
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 403 &&
          error.message.includes('Nur der zugewiesene Reviewer'),
      );
      assert.equal(updateCalled, false);
    } finally {
      restoreReviewRequest();
    }
  });

  await t.test('status-only review updates do not inject comment nulling', async () => {
    let capturedData: Record<string, unknown> | null = null;
    const restoreReviewRequest = patchPrismaDelegate('reviewRequest', {
      findUnique: async () => ({
        id: 'review-1',
        reviewerId: 'reviewer-1',
        document: { tenantId: 'tenant-a' },
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        capturedData = data;
        return { id: 'review-1', ...data };
      },
    });

    try {
      await complianceService.updateReviewRequest('review-1', {
        tenantId: 'tenant-a',
        actorUserId: 'reviewer-1',
        status: 'APPROVED',
      });

      assert.ok(capturedData);
      assert.equal(capturedData?.status, 'APPROVED');
      assert.equal('comments' in (capturedData as Record<string, unknown>), false);
    } finally {
      restoreReviewRequest();
    }
  });
});
