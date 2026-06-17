import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { complianceService } from './compliance.service.js';

type RestoreFn = () => void;

function mockPrismaMethod(path: string[], replacement: (...args: any[]) => any): RestoreFn {
  let target: any = prisma;
  for (let index = 0; index < path.length - 1; index += 1) {
    if (target[path[index]] === undefined) {
      target[path[index]] = {};
    }
    target = target[path[index]];
  }

  const methodName = path[path.length - 1];
  const original = target[methodName];
  target[methodName] = replacement;

  return () => {
    target[methodName] = original;
  };
}

function restoreAll(restores: RestoreFn[]) {
  while (restores.length > 0) {
    const restore = restores.pop();
    restore?.();
  }
}

test('listQualityFindings scopes results to tenant-owned documents and jobs', async () => {
  const restores: RestoreFn[] = [];
  try {
    restores.push(
      mockPrismaMethod(['document', 'findMany'], async () => [{ id: 'doc-1' }]),
      mockPrismaMethod(['generationJob', 'findMany'], async () => [{ id: 'job-1' }]),
    );

    let capturedWhere: Record<string, unknown> | undefined;
    restores.push(
      mockPrismaMethod(['qualityFinding', 'findMany'], async (args: any) => {
        capturedWhere = args.where;
        return [];
      }),
    );

    await complianceService.listQualityFindings({ tenantId: 'tenant-a' });

    assert.deepEqual(capturedWhere, {
      OR: [{ documentId: { in: ['doc-1'] } }, { generationJobId: { in: ['job-1'] } }],
    });
  } finally {
    restoreAll(restores);
  }
});

test('updateQualityFinding rejects cross-tenant updates', async () => {
  const restores: RestoreFn[] = [];
  try {
    restores.push(
      mockPrismaMethod(['qualityFinding', 'findUnique'], async () => ({
        id: 'finding-1',
        documentId: 'doc-foreign',
        generationJobId: null,
      })),
      mockPrismaMethod(['document', 'findUnique'], async () => ({
        id: 'doc-foreign',
        tenantId: 'tenant-b',
      })),
      mockPrismaMethod(['qualityFinding', 'update'], async () => {
        throw new Error('update should not be called for foreign tenant data');
      }),
    );

    await assert.rejects(
      () =>
        complianceService.updateQualityFinding(
          'finding-1',
          { action: 'RESOLVE', resolution: 'done' },
          'tenant-a',
        ),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('Zugriff'),
    );
  } finally {
    restoreAll(restores);
  }
});

test('runQualityChecks rejects documents from other tenants before mutating findings', async () => {
  const restores: RestoreFn[] = [];
  try {
    restores.push(
      mockPrismaMethod(['document', 'findUnique'], async () => ({
        id: 'doc-foreign',
        tenantId: 'tenant-b',
        title: 'Foreign Document',
        category: 'DOCUMENTATION',
        content: 'secret',
      })),
    );

    let deleteCalled = false;
    restores.push(
      mockPrismaMethod(['qualityFinding', 'deleteMany'], async () => {
        deleteCalled = true;
        return { count: 0 };
      }),
      mockPrismaMethod(['qualityFinding', 'createMany'], async () => ({ count: 0 })),
    );

    await assert.rejects(
      () => complianceService.runQualityChecks('doc-foreign', 'tenant-a'),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message.includes('Zugriff'),
    );

    assert.equal(deleteCalled, false);
  } finally {
    restoreAll(restores);
  }
});
