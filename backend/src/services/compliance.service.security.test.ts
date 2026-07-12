import assert from 'node:assert/strict';
import test from 'node:test';
import { complianceService } from './compliance.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

type PrismaPatchMap = Record<string, unknown>;

async function withPatchedPrisma<T>(patches: PrismaPatchMap, callback: () => Promise<T>) {
  const originals = new Map<string, unknown>();

  for (const [key, value] of Object.entries(patches)) {
    originals.set(key, (prisma as any)[key]);
    (prisma as any)[key] = value;
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of originals.entries()) {
      if (value === undefined) {
        delete (prisma as any)[key];
      } else {
        (prisma as any)[key] = value;
      }
    }
  }
}

test('listQualityFindings scopes query to active tenant', async () => {
  let capturedWhere: unknown = null;

  await withPatchedPrisma(
    {
      qualityFinding: {
        findMany: async ({ where }: { where: unknown }) => {
          capturedWhere = where;
          return [];
        },
      },
    },
    async () => {
      await complianceService.listQualityFindings('tenant-a', 'doc-1');
    },
  );

  assert.deepEqual(capturedWhere, {
    documentId: 'doc-1',
    document: {
      tenantId: 'tenant-a',
    },
  });
});

test('updateQualityFinding rejects cross-tenant writes', async () => {
  let updateCalled = false;

  await assert.rejects(
    () =>
      withPatchedPrisma(
        {
          qualityFinding: {
            findUnique: async () => ({
              id: 'finding-1',
              documentId: 'doc-2',
              document: {
                tenantId: 'tenant-b',
              },
            }),
            update: async () => {
              updateCalled = true;
              return {};
            },
          },
        },
        async () => complianceService.updateQualityFinding('finding-1', { action: 'RESOLVE' }, 'tenant-a'),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal((error as ApplicationError).statusCode, 403);
      return true;
    },
  );

  assert.equal(updateCalled, false);
});

test('runQualityChecks blocks cross-tenant document access before mutations', async () => {
  let deleteCalled = false;
  let createCalled = false;

  await assert.rejects(
    () =>
      withPatchedPrisma(
        {
          document: {
            findUnique: async () => ({
              id: 'doc-foreign',
              content: '<p>Some content</p>',
              title: 'Foreign Document',
              category: 'POLICY',
              tenantId: 'tenant-b',
            }),
          },
          qualityFinding: {
            deleteMany: async () => {
              deleteCalled = true;
              return { count: 0 };
            },
            createMany: async () => {
              createCalled = true;
              return { count: 0 };
            },
          },
        },
        async () => complianceService.runQualityChecks('doc-foreign', 'tenant-a'),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal((error as ApplicationError).statusCode, 403);
      return true;
    },
  );

  assert.equal(deleteCalled, false);
  assert.equal(createCalled, false);
});
