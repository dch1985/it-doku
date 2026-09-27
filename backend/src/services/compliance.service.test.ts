import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';

type PrismaWithMocks = typeof prisma & {
  qualityFinding: {
    findMany: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
  };
};

test('listQualityFindings scopes rows to tenant-owned documents/jobs', async () => {
  const prismaMock = prisma as unknown as PrismaWithMocks;
  const original = prismaMock.qualityFinding;
  const captured: Record<string, unknown> = {};

  prismaMock.qualityFinding = {
    ...original,
    findMany: async (args: Record<string, unknown>) => {
      captured.args = args;
      return [];
    },
  };

  try {
    await complianceService.listQualityFindings('tenant-a', 'document-a');
  } finally {
    prismaMock.qualityFinding = original;
  }

  const where = (captured.args as { where: Record<string, unknown> }).where;
  assert.equal(where.documentId, 'document-a');
  assert.deepEqual(where.OR, [
    { document: { tenantId: 'tenant-a' } },
    { generationJob: { tenantId: 'tenant-a' } },
  ]);
});

test('updateQualityFinding rejects cross-tenant mutation attempts', async () => {
  const prismaMock = prisma as unknown as PrismaWithMocks;
  const original = prismaMock.qualityFinding;

  prismaMock.qualityFinding = {
    ...original,
    findUnique: async () => ({
      id: 'finding-a',
      document: { tenantId: 'tenant-a' },
      generationJob: null,
    }),
    update: async () => {
      throw new Error('update should not be called for cross-tenant mutation');
    },
  };

  try {
    await assert.rejects(
      complianceService.updateQualityFinding('finding-a', {
        tenantId: 'tenant-b',
        action: 'RESOLVE',
        resolution: 'attempted',
      }),
      (error: any) =>
        error?.statusCode === 403 &&
        String(error?.message ?? '').includes('Zugriff auf dieses Finding ist nicht erlaubt'),
    );
  } finally {
    prismaMock.qualityFinding = original;
  }
});

test('updateQualityFinding allows same-tenant resolution updates', async () => {
  const prismaMock = prisma as unknown as PrismaWithMocks;
  const original = prismaMock.qualityFinding;
  const captured: Record<string, unknown> = {};

  prismaMock.qualityFinding = {
    ...original,
    findUnique: async () => ({
      id: 'finding-a',
      document: { tenantId: 'tenant-a' },
      generationJob: null,
    }),
    update: async (args: Record<string, unknown>) => {
      captured.args = args;
      return { id: 'finding-a' };
    },
  };

  try {
    await complianceService.updateQualityFinding('finding-a', {
      tenantId: 'tenant-a',
      action: 'RESOLVE',
      resolution: 'fixed',
    });
  } finally {
    prismaMock.qualityFinding = original;
  }

  const data = (captured.args as { data: Record<string, unknown> }).data;
  assert.equal(data.resolution, 'fixed');
  assert.ok(data.resolvedAt instanceof Date);
});
