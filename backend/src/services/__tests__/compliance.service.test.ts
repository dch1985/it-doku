import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from '../compliance.service.js';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';

test('listQualityFindings scopes by tenant', async () => {
  const prismaMock = prisma as any;
  const originalQualityFinding = prismaMock.qualityFinding;
  let capturedWhere: Record<string, unknown> | null = null;

  prismaMock.qualityFinding = {
    findMany: async ({ where }: { where: Record<string, unknown> }) => {
      capturedWhere = where;
      return [];
    },
  };

  try {
    const findings = await complianceService.listQualityFindings('tenant-a', 'doc-1');
    assert.deepEqual(findings, []);
    assert.deepEqual(capturedWhere, {
      documentId: 'doc-1',
      OR: [
        { document: { tenantId: 'tenant-a' } },
        { generationJob: { tenantId: 'tenant-a' } },
      ],
    });
  } finally {
    prismaMock.qualityFinding = originalQualityFinding;
  }
});

test('updateQualityFinding blocks cross-tenant updates', async () => {
  const prismaMock = prisma as any;
  const originalQualityFinding = prismaMock.qualityFinding;
  let updateCalled = false;

  prismaMock.qualityFinding = {
    findFirst: async () => null,
    update: async () => {
      updateCalled = true;
      return {};
    },
  };

  try {
    await assert.rejects(
      complianceService.updateQualityFinding('finding-1', 'tenant-a', { action: 'RESOLVE' }),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 404);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaMock.qualityFinding = originalQualityFinding;
  }
});

test('runQualityChecks rejects documents outside tenant scope', async () => {
  const prismaMock = prisma as any;
  const originalDocument = prismaMock.document;
  let capturedWhere: Record<string, unknown> | null = null;

  prismaMock.document = {
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      capturedWhere = where;
      return null;
    },
  };

  try {
    await assert.rejects(
      complianceService.runQualityChecks('doc-foreign', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 404);
        return true;
      },
    );
    assert.deepEqual(capturedWhere, {
      id: 'doc-foreign',
      tenantId: 'tenant-a',
    });
  } finally {
    prismaMock.document = originalDocument;
  }
});
