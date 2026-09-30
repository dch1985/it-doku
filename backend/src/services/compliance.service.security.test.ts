import test from 'node:test';
import assert from 'node:assert/strict';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

type RestoreFn = () => void;

function mockModelMethod(modelName: string, methodName: string, replacement: (...args: any[]) => any): RestoreFn {
  const prismaRef = prisma as any;
  const model = prismaRef[modelName] ?? (prismaRef[modelName] = {});
  const original = model[methodName];
  model[methodName] = replacement;

  return () => {
    model[methodName] = original;
  };
}

test('listQualityFindings applies tenant scoping filter', async () => {
  let capturedArgs: any = null;
  const restoreFindMany = mockModelMethod('qualityFinding', 'findMany', async (args: any) => {
    capturedArgs = args;
    return [];
  });

  try {
    await complianceService.listQualityFindings(undefined, 'tenant-a');
    assert.ok(capturedArgs, 'findMany should be called');
    assert.deepEqual(capturedArgs.where?.OR, [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ]);
  } finally {
    restoreFindMany();
  }
});

test('updateQualityFinding blocks cross-tenant updates', async () => {
  let updateCalled = false;
  const restoreFindUnique = mockModelMethod('qualityFinding', 'findUnique', async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  }));
  const restoreUpdate = mockModelMethod('qualityFinding', 'update', async () => {
    updateCalled = true;
    return { id: 'finding-1' };
  });

  try {
    await assert.rejects(
      () => complianceService.updateQualityFinding('finding-1', { action: 'RESOLVE' }, 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false, 'update must not execute for cross-tenant access');
  } finally {
    restoreFindUnique();
    restoreUpdate();
  }
});

test('runQualityChecks blocks cross-tenant quality overwrite', async () => {
  let deleteManyCalled = false;
  let createManyCalled = false;

  const restoreFindDocument = mockModelMethod('document', 'findUnique', async () => ({
    id: 'doc-1',
    tenantId: 'tenant-b',
    title: 'Other Tenant Doc',
    category: 'SERVER',
    content: '<p>dummy text</p>',
  }));
  const restoreDeleteMany = mockModelMethod('qualityFinding', 'deleteMany', async () => {
    deleteManyCalled = true;
    return { count: 1 };
  });
  const restoreCreateMany = mockModelMethod('qualityFinding', 'createMany', async () => {
    createManyCalled = true;
    return { count: 1 };
  });

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(deleteManyCalled, false, 'findings must not be deleted for unauthorized tenant');
    assert.equal(createManyCalled, false, 'findings must not be created for unauthorized tenant');
  } finally {
    restoreFindDocument();
    restoreDeleteMany();
    restoreCreateMany();
  }
});
