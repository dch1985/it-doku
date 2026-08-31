import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { complianceService } from './compliance.service.js';

test('listQualityFindings scopes reads to tenant-owned records', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.qualityFinding);
  const delegate = prismaAny.qualityFinding ?? (prismaAny.qualityFinding = {});
  const originalFindMany = delegate.findMany;
  let capturedArgs: any = null;

  delegate.findMany = async (args: any) => {
    capturedArgs = args;
    return [];
  };

  try {
    await complianceService.listQualityFindings('tenant-a', 'doc-1');
    assert.equal(capturedArgs?.where?.documentId, 'doc-1');
    assert.deepEqual(capturedArgs?.where?.OR, [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ]);
  } finally {
    delegate.findMany = originalFindMany;
    if (!hadDelegate) {
      delete prismaAny.qualityFinding;
    }
  }
});

test('updateQualityFinding blocks cross-tenant mutations', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.qualityFinding);
  const delegate = prismaAny.qualityFinding ?? (prismaAny.qualityFinding = {});
  const originalFindUnique = delegate.findUnique;
  const originalUpdate = delegate.update;
  let updateCalled = false;

  delegate.findUnique = async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  });
  delegate.update = async () => {
    updateCalled = true;
    return { id: 'finding-1' };
  };

  try {
    await assert.rejects(
      () => complianceService.updateQualityFinding('finding-1', { action: 'RESOLVE' }, 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    delegate.findUnique = originalFindUnique;
    delegate.update = originalUpdate;
    if (!hadDelegate) {
      delete prismaAny.qualityFinding;
    }
  }
});

test('runQualityChecks rejects documents outside tenant ownership', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.document);
  const delegate = prismaAny.document ?? (prismaAny.document = {});
  const originalFindFirst = delegate.findFirst;

  delegate.findFirst = async () => null;

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-foreign', 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 404);
        return true;
      },
    );
  } finally {
    delegate.findFirst = originalFindFirst;
    if (!hadDelegate) {
      delete prismaAny.document;
    }
  }
});
