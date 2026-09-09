import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { complianceService } from './compliance.service.js';

function stubPrismaMethod(path: string[], replacement: (...args: any[]) => any): () => void {
  let target: any = prisma as any;
  for (const segment of path.slice(0, -1)) {
    if (!target[segment]) {
      target[segment] = {};
    }
    target = target[segment];
  }

  const methodName = path[path.length - 1]!;
  const original = target[methodName];
  target[methodName] = replacement;

  return () => {
    target[methodName] = original;
  };
}

test('listQualityFindings rejects document access outside tenant', async (t) => {
  let listCalled = false;
  const restoreFindDocument = stubPrismaMethod(['document', 'findUnique'], async () => ({
    id: 'doc-1',
    tenantId: 'tenant-b',
  }));
  const restoreListFindings = stubPrismaMethod(['qualityFinding', 'findMany'], async () => {
    listCalled = true;
    return [];
  });

  t.after(() => {
    restoreListFindings();
    restoreFindDocument();
  });

  await assert.rejects(
    () => complianceService.listQualityFindings('tenant-a', 'doc-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('nicht erlaubt'),
  );
  assert.equal(listCalled, false);
});

test('updateQualityFinding rejects cross-tenant updates', async (t) => {
  let updateCalled = false;
  const restoreFindFinding = stubPrismaMethod(['qualityFinding', 'findUnique'], async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  }));
  const restoreUpdateFinding = stubPrismaMethod(['qualityFinding', 'update'], async () => {
    updateCalled = true;
    return { id: 'finding-1' };
  });

  t.after(() => {
    restoreUpdateFinding();
    restoreFindFinding();
  });

  await assert.rejects(
    () =>
      complianceService.updateQualityFinding(
        'finding-1',
        { action: 'RESOLVE', resolution: 'fixed' },
        'tenant-a',
      ),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('nicht erlaubt'),
  );
  assert.equal(updateCalled, false);
});

test('runQualityChecks rejects cross-tenant execution before writes', async (t) => {
  let deleteCalled = false;
  const restoreFindDocument = stubPrismaMethod(['document', 'findUnique'], async () => ({
    id: 'doc-1',
    content: 'Example content with review',
    title: 'Doc',
    category: 'SERVER',
    tenantId: 'tenant-b',
  }));
  const restoreDeleteFindings = stubPrismaMethod(['qualityFinding', 'deleteMany'], async () => {
    deleteCalled = true;
    return { count: 0 };
  });

  t.after(() => {
    restoreDeleteFindings();
    restoreFindDocument();
  });

  await assert.rejects(
    () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('nicht erlaubt'),
  );
  assert.equal(deleteCalled, false);
});
