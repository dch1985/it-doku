import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

const prismaAny = prisma as any;

function withMockedPrisma(
  overrides: Partial<{
    qualityFinding: Record<string, unknown>;
    document: Record<string, unknown>;
  }>
) {
  const previous = {
    qualityFinding: prismaAny.qualityFinding,
    document: prismaAny.document,
  };

  prismaAny.qualityFinding = {
    ...(previous.qualityFinding ?? {}),
    ...(overrides.qualityFinding ?? {}),
  };

  prismaAny.document = {
    ...(previous.document ?? {}),
    ...(overrides.document ?? {}),
  };

  return () => {
    prismaAny.qualityFinding = previous.qualityFinding;
    prismaAny.document = previous.document;
  };
}

test('listQualityFindings scopes by tenant ownership', async () => {
  let capturedArgs: any = null;

  const restore = withMockedPrisma({
    qualityFinding: {
      findMany: async (args: any) => {
        capturedArgs = args;
        return [];
      },
    },
  });

  try {
    await complianceService.listQualityFindings(undefined, 'tenant-a');

    assert.ok(capturedArgs, 'Expected listQualityFindings to call prisma.qualityFinding.findMany');
    assert.deepEqual(capturedArgs.where.OR, [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ]);
  } finally {
    restore();
  }
});

test('updateQualityFinding rejects cross-tenant update attempts', async () => {
  let updateCalled = false;

  const restore = withMockedPrisma({
    qualityFinding: {
      findUnique: async () => ({
        id: 'finding-1',
        document: { tenantId: 'tenant-b' },
        generationJob: null,
      }),
      update: async () => {
        updateCalled = true;
        return {};
      },
    },
  });

  try {
    await assert.rejects(
      () => complianceService.updateQualityFinding('finding-1', { action: 'RESOLVE' }, 'tenant-a'),
      (error: any) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('nicht erlaubt')
    );

    assert.equal(updateCalled, false, 'Expected update to be blocked before write');
  } finally {
    restore();
  }
});

test('runQualityChecks rejects cross-tenant document access before deleting findings', async () => {
  let deleteCalled = false;

  const restore = withMockedPrisma({
    document: {
      findUnique: async () => ({
        id: 'doc-1',
        title: 'Confidential runbook',
        content: 'review owner',
        category: 'SECURITY',
        tenantId: 'tenant-b',
      }),
    },
    qualityFinding: {
      deleteMany: async () => {
        deleteCalled = true;
        return { count: 0 };
      },
      createMany: async () => ({ count: 0 }),
    },
  });

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: any) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('nicht erlaubt')
    );

    assert.equal(deleteCalled, false, 'Expected finding deletion to be blocked for foreign tenant');
  } finally {
    restore();
  }
});
