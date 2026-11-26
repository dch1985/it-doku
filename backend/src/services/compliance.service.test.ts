import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';

type QualityFindingDelegate = {
  findMany: (...args: any[]) => Promise<any>;
  findUnique: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
};

const prismaClient = prisma as any;
if (!prismaClient.qualityFinding) {
  prismaClient.qualityFinding = {
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => null,
  };
}

const qualityFindingDelegate = prismaClient.qualityFinding as QualityFindingDelegate;

test('listQualityFindings applies tenant scoping when tenantId is provided', async () => {
  const originalFindMany = qualityFindingDelegate.findMany;
  let capturedArgs: any = null;

  qualityFindingDelegate.findMany = async (args: any) => {
    capturedArgs = args;
    return [];
  };

  try {
    await complianceService.listQualityFindings('tenant-a', 'doc-1');
  } finally {
    qualityFindingDelegate.findMany = originalFindMany;
  }

  assert.ok(capturedArgs, 'Expected findMany to be called');
  assert.equal(capturedArgs.where.documentId, 'doc-1');
  assert.deepEqual(capturedArgs.where.OR, [
    { document: { tenantId: 'tenant-a' } },
    { generationJob: { tenantId: 'tenant-a' } },
  ]);
});

test('updateQualityFinding rejects updates for findings from another tenant', async () => {
  const originalFindUnique = qualityFindingDelegate.findUnique;
  qualityFindingDelegate.findUnique = async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  });

  try {
    await assert.rejects(
      () =>
        complianceService.updateQualityFinding(
          'finding-1',
          { action: 'RESOLVE', resolution: 'resolved' },
          'tenant-a',
        ),
      (error: any) => {
        assert.equal(error?.statusCode, 403);
        return true;
      },
    );
  } finally {
    qualityFindingDelegate.findUnique = originalFindUnique;
  }
});

test('updateQualityFinding resolves finding for same tenant', async () => {
  const originalFindUnique = qualityFindingDelegate.findUnique;
  const originalUpdate = qualityFindingDelegate.update;
  let updatePayload: any = null;

  qualityFindingDelegate.findUnique = async () => ({
    id: 'finding-2',
    document: { tenantId: 'tenant-a' },
    generationJob: null,
  });

  qualityFindingDelegate.update = async (args: any) => {
    updatePayload = args;
    return { id: 'finding-2', ...args.data };
  };

  try {
    const updated = await complianceService.updateQualityFinding(
      'finding-2',
      { action: 'RESOLVE', resolution: 'fixed' },
      'tenant-a',
    );

    assert.equal(updated.id, 'finding-2');
    assert.equal(updatePayload.where.id, 'finding-2');
    assert.equal(updatePayload.data.resolution, 'fixed');
    assert.ok(updatePayload.data.resolvedAt instanceof Date);
  } finally {
    qualityFindingDelegate.findUnique = originalFindUnique;
    qualityFindingDelegate.update = originalUpdate;
  }
});
