import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { automationService } from './automation.service.js';
import { complianceService } from './compliance.service.js';
import { ApplicationError } from '../middleware/errorHandler.js';

const prismaAny = prisma as any;

function snapshotDelegates() {
  return {
    generationJob: prismaAny.generationJob,
    updateSuggestion: prismaAny.updateSuggestion,
    document: prismaAny.document,
    qualityFinding: prismaAny.qualityFinding,
  };
}

function restoreDelegates(snapshot: ReturnType<typeof snapshotDelegates>) {
  prismaAny.generationJob = snapshot.generationJob;
  prismaAny.updateSuggestion = snapshot.updateSuggestion;
  prismaAny.document = snapshot.document;
  prismaAny.qualityFinding = snapshot.qualityFinding;
}

test('approveJob blocks cross-tenant approvals', async () => {
  const snapshot = snapshotDelegates();
  let updateCalled = false;

  prismaAny.generationJob = {
    findUnique: async () => ({ id: 'job-1', tenantId: 'tenant-b' }),
    update: async () => {
      updateCalled = true;
      return { id: 'job-1' };
    },
  };

  try {
    await assert.rejects(
      automationService.approveJob('job-1', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    restoreDelegates(snapshot);
  }
});

test('updateSuggestion blocks cross-tenant updates', async () => {
  const snapshot = snapshotDelegates();
  let updateCalled = false;

  prismaAny.updateSuggestion = {
    findUnique: async () => ({
      id: 'suggestion-1',
      generationJob: { tenantId: 'tenant-b' },
    }),
    update: async () => {
      updateCalled = true;
      return { id: 'suggestion-1' };
    },
  };

  try {
    await assert.rejects(
      automationService.updateSuggestion('suggestion-1', { status: 'APPLIED' }, 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    restoreDelegates(snapshot);
  }
});

test('listQualityFindings blocks foreign document access', async () => {
  const snapshot = snapshotDelegates();
  let findManyCalled = false;

  prismaAny.document = {
    findUnique: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      tenantId: 'tenant-b',
    }),
    findMany: async () => [{ id: 'doc-1' }],
  };
  prismaAny.qualityFinding = {
    findMany: async () => {
      findManyCalled = true;
      return [];
    },
  };

  try {
    await assert.rejects(
      complianceService.listQualityFindings('tenant-a', 'doc-b'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(findManyCalled, false);
  } finally {
    restoreDelegates(snapshot);
  }
});

test('runQualityChecks blocks foreign document mutations', async () => {
  const snapshot = snapshotDelegates();
  let deleteManyCalled = false;

  prismaAny.document = {
    findUnique: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      tenantId: 'tenant-b',
      content: 'review owner',
      title: 'foreign',
      category: 'SECURITY',
    }),
  };
  prismaAny.qualityFinding = {
    deleteMany: async () => {
      deleteManyCalled = true;
      return { count: 0 };
    },
    createMany: async () => ({ count: 0 }),
  };

  try {
    await assert.rejects(
      complianceService.runQualityChecks('doc-b', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(deleteManyCalled, false);
  } finally {
    restoreDelegates(snapshot);
  }
});
