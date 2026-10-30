import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';

test('listQualityFindings scopes results to the active tenant', async () => {
  const prismaAny = prisma as any;
  const originalQualityFinding = prismaAny.qualityFinding;
  const capturedCalls: any[] = [];

  prismaAny.qualityFinding = {
    findMany: async (args: any) => {
      capturedCalls.push(args);
      return [];
    },
  };

  try {
    await complianceService.listQualityFindings('tenant-a');
    assert.equal(capturedCalls.length, 1);
    assert.deepEqual(capturedCalls[0]?.where?.OR, [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ]);
  } finally {
    prismaAny.qualityFinding = originalQualityFinding;
  }
});

test('updateQualityFinding rejects cross-tenant updates', async () => {
  const prismaAny = prisma as any;
  const originalQualityFinding = prismaAny.qualityFinding;
  let updateCalled = false;

  prismaAny.qualityFinding = {
    findFirst: async () => null,
    update: async () => {
      updateCalled = true;
      return {};
    },
  };

  try {
    await assert.rejects(
      () =>
        complianceService.updateQualityFinding('finding-1', {
          tenantId: 'tenant-a',
          action: 'RESOLVE',
          resolution: 'Done',
        }),
      (error: any) => {
        assert.equal(error?.statusCode, 404);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaAny.qualityFinding = originalQualityFinding;
  }
});

test('runQualityChecks blocks access to documents from other tenants', async () => {
  const prismaAny = prisma as any;
  const originalDocument = prismaAny.document;

  prismaAny.document = {
    findUnique: async () => ({
      id: 'doc-1',
      content: 'review owner',
      title: 'Doc',
      category: 'SECURITY',
      tenantId: 'tenant-b',
    }),
  };

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: any) => {
        assert.equal(error?.statusCode, 403);
        return true;
      },
    );
  } finally {
    prismaAny.document = originalDocument;
  }
});
