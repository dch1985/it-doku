import test from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

type RestoreFn = () => void;

function patchMethod(target: Record<string, any>, method: string, replacement: any, restores: RestoreFn[]) {
  const original = target[method];
  target[method] = replacement;
  restores.push(() => {
    target[method] = original;
  });
}

function ensurePrismaModel(modelName: string, restores: RestoreFn[]): Record<string, any> {
  const prismaClient = prisma as unknown as Record<string, any>;
  const original = prismaClient[modelName];
  if (!original) {
    prismaClient[modelName] = {};
  }

  restores.push(() => {
    if (typeof original === 'undefined') {
      delete prismaClient[modelName];
      return;
    }
    prismaClient[modelName] = original;
  });

  return prismaClient[modelName] as Record<string, any>;
}

test('listQualityFindings applies tenant scope filter', async () => {
  const restores: RestoreFn[] = [];
  const qualityFinding = ensurePrismaModel('qualityFinding', restores);
  let capturedWhere: unknown;

  patchMethod(
    qualityFinding,
    'findMany',
    async ({ where }: { where: unknown }) => {
      capturedWhere = where;
      return [];
    },
    restores,
  );

  try {
    await complianceService.listQualityFindings('tenant-a', 'doc-123');

    assert.deepEqual(capturedWhere, {
      documentId: 'doc-123',
      OR: [{ document: { tenantId: 'tenant-a' } }, { generationJob: { tenantId: 'tenant-a' } }],
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('updateQualityFinding rejects updates from another tenant', async () => {
  const restores: RestoreFn[] = [];
  const qualityFinding = ensurePrismaModel('qualityFinding', restores);
  let updateCalled = false;

  patchMethod(
    qualityFinding,
    'findUnique',
    async () => ({
      id: 'finding-1',
      document: { tenantId: 'tenant-a' },
      generationJob: null,
    }),
    restores,
  );
  patchMethod(
    qualityFinding,
    'update',
    async () => {
      updateCalled = true;
      return null;
    },
    restores,
  );

  try {
    await assert.rejects(
      () =>
        complianceService.updateQualityFinding('finding-1', 'tenant-b', {
          action: 'RESOLVE',
          resolution: 'fixed',
        }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('nicht erlaubt'),
    );

    assert.equal(updateCalled, false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('updateQualityFinding updates records owned by tenant', async () => {
  const restores: RestoreFn[] = [];
  const qualityFinding = ensurePrismaModel('qualityFinding', restores);
  let capturedUpdate: unknown;

  patchMethod(
    qualityFinding,
    'findUnique',
    async () => ({
      id: 'finding-2',
      document: null,
      generationJob: { tenantId: 'tenant-a' },
    }),
    restores,
  );
  patchMethod(
    qualityFinding,
    'update',
    async (args: unknown) => {
      capturedUpdate = args;
      return { id: 'finding-2' };
    },
    restores,
  );

  try {
    await complianceService.updateQualityFinding('finding-2', 'tenant-a', {
      action: 'RESOLVE',
      resolution: 'done',
    });

    assert.equal((capturedUpdate as any)?.where?.id, 'finding-2');
    assert.equal((capturedUpdate as any)?.data?.resolution, 'done');
    assert.ok((capturedUpdate as any)?.data?.resolvedAt instanceof Date);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('runQualityChecks rejects documents from other tenants', async () => {
  const restores: RestoreFn[] = [];
  const documentModel = ensurePrismaModel('document', restores);
  const qualityFinding = ensurePrismaModel('qualityFinding', restores);
  let deleteCalled = false;

  patchMethod(
    documentModel,
    'findUnique',
    async () => ({
      id: 'doc-999',
      content: 'example content',
      title: 'Example',
      category: 'DOCUMENTATION',
      tenantId: 'tenant-a',
    }),
    restores,
  );
  patchMethod(
    qualityFinding,
    'deleteMany',
    async () => {
      deleteCalled = true;
      return { count: 0 };
    },
    restores,
  );

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-999', 'tenant-b'),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('nicht erlaubt'),
    );

    assert.equal(deleteCalled, false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
