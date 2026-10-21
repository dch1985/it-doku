import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

test('listQualityFindings scopes findings by tenant', async () => {
  const prismaClient = prisma as any;
  const originalQualityFinding = prismaClient.qualityFinding;
  let capturedArgs: any = null;

  prismaClient.qualityFinding = {
    findMany: async (args: any) => {
      capturedArgs = args;
      return [];
    },
  };

  try {
    await complianceService.listQualityFindings('tenant-a', 'doc-1');
    assert.deepEqual(capturedArgs?.where, {
      documentId: 'doc-1',
      OR: [
        { document: { tenantId: 'tenant-a' } },
        { generationJob: { tenantId: 'tenant-a' } },
      ],
    });
  } finally {
    prismaClient.qualityFinding = originalQualityFinding;
  }
});

test('updateQualityFinding blocks access to findings from another tenant', async () => {
  const prismaClient = prisma as any;
  const originalQualityFinding = prismaClient.qualityFinding;
  let updateCalled = false;

  prismaClient.qualityFinding = {
    findUnique: async () => ({
      id: 'finding-1',
      document: { tenantId: 'tenant-b' },
      generationJob: null,
    }),
    update: async () => {
      updateCalled = true;
      return {};
    },
  };

  try {
    await assert.rejects(
      complianceService.updateQualityFinding(
        'finding-1',
        { action: 'RESOLVE', resolution: 'done' },
        'tenant-a',
      ),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaClient.qualityFinding = originalQualityFinding;
  }
});

test('runQualityChecks rejects cross-tenant document access before mutating findings', async () => {
  const prismaClient = prisma as any;
  const originalDocument = prismaClient.document;
  const originalQualityFinding = prismaClient.qualityFinding;
  let deleteCalled = false;
  let createManyCalled = false;

  prismaClient.document = {
    findUnique: async () => ({
      id: 'doc-1',
      content: 'review owner',
      title: 'Critical doc',
      category: 'SECURITY',
      tenantId: 'tenant-b',
    }),
  };

  prismaClient.qualityFinding = {
    deleteMany: async () => {
      deleteCalled = true;
    },
    createMany: async () => {
      createManyCalled = true;
    },
  };

  try {
    await assert.rejects(
      complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(deleteCalled, false);
    assert.equal(createManyCalled, false);
  } finally {
    prismaClient.document = originalDocument;
    prismaClient.qualityFinding = originalQualityFinding;
  }
});
