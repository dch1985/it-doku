import assert from 'node:assert/strict';
import { test } from 'node:test';
import { automationService } from '../automation.service.js';
import { complianceService } from '../compliance.service.js';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';

type MutablePrisma = Record<string, any>;

function withPrismaStubs(stubs: Record<string, any>) {
  const prismaAny = prisma as unknown as MutablePrisma;
  const originalEntries = Object.entries(stubs).map(([key, value]) => {
    const previous = prismaAny[key];
    prismaAny[key] = value;
    return [key, previous] as const;
  });

  return () => {
    for (const [key, value] of originalEntries) {
      prismaAny[key] = value;
    }
  };
}

test('automationService.approveJob blocks cross-tenant approvals', async () => {
  let updateCalled = false;
  const restore = withPrismaStubs({
    generationJob: {
      findUnique: async () => ({ id: 'job-1', tenantId: 'tenant-b' }),
      update: async () => {
        updateCalled = true;
        return { id: 'job-1', status: 'COMPLETED' };
      },
    },
  });

  try {
    await assert.rejects(
      () => automationService.approveJob('job-1', 'tenant-a'),
      (error: any) => error instanceof ApplicationError && error.statusCode === 404,
    );
    assert.equal(updateCalled, false);
  } finally {
    restore();
  }
});

test('automationService.updateSuggestion blocks cross-tenant updates', async () => {
  let updateCalled = false;
  const restore = withPrismaStubs({
    updateSuggestion: {
      findUnique: async () => ({
        id: 'suggestion-1',
        generationJob: { tenantId: 'tenant-b' },
      }),
      update: async () => {
        updateCalled = true;
        return { id: 'suggestion-1', status: 'APPLIED' };
      },
    },
  });

  try {
    await assert.rejects(
      () =>
        automationService.updateSuggestion(
          'suggestion-1',
          { status: 'APPLIED', resolution: 'Apply it' },
          'tenant-a',
        ),
      (error: any) => error instanceof ApplicationError && error.statusCode === 404,
    );
    assert.equal(updateCalled, false);
  } finally {
    restore();
  }
});

test('complianceService.runQualityChecks blocks cross-tenant quality execution', async () => {
  let deleteCalled = false;
  const restore = withPrismaStubs({
    document: {
      findUnique: async () => ({
        id: 'doc-1',
        title: 'Sensitive Doc',
        content: '<p>content</p>',
        category: 'SECURITY',
        tenantId: 'tenant-b',
      }),
    },
    qualityFinding: {
      deleteMany: async () => {
        deleteCalled = true;
      },
      createMany: async () => undefined,
    },
  });

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: any) => error instanceof ApplicationError && error.statusCode === 403,
    );
    assert.equal(deleteCalled, false);
  } finally {
    restore();
  }
});

test('complianceService.updateQualityFinding blocks cross-tenant mutation', async () => {
  let updateCalled = false;
  const restore = withPrismaStubs({
    qualityFinding: {
      findUnique: async () => ({
        id: 'finding-1',
        document: { tenantId: 'tenant-b' },
      }),
      update: async () => {
        updateCalled = true;
        return { id: 'finding-1' };
      },
    },
  });

  try {
    await assert.rejects(
      () =>
        complianceService.updateQualityFinding(
          'finding-1',
          { action: 'RESOLVE', resolution: 'Fixed' },
          'tenant-a',
        ),
      (error: any) => error instanceof ApplicationError && error.statusCode === 404,
    );
    assert.equal(updateCalled, false);
  } finally {
    restore();
  }
});

test('complianceService.listQualityFindings scopes queries to tenant documents', async () => {
  let capturedWhere: Record<string, unknown> | null = null;
  const restore = withPrismaStubs({
    qualityFinding: {
      findMany: async (args: Record<string, unknown>) => {
        capturedWhere = (args.where as Record<string, unknown>) ?? null;
        return [];
      },
    },
  });

  try {
    await complianceService.listQualityFindings(undefined, 'tenant-a');
    assert.deepEqual(capturedWhere, {
      document: {
        tenantId: 'tenant-a',
      },
    });
  } finally {
    restore();
  }
});
