import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';
import { complianceService } from '../src/services/compliance.service.js';

type PrismaLike = Record<string, unknown>;
const prismaStub = prisma as unknown as PrismaLike;

const originalQualityFindingModel = prismaStub.qualityFinding;
const originalDocumentModel = prismaStub.document;

afterEach(() => {
  prismaStub.qualityFinding = originalQualityFindingModel;
  prismaStub.document = originalDocumentModel;
});

describe('complianceService quality tenant isolation', () => {
  it('scopes quality finding listing to the active tenant', async () => {
    let capturedQuery: any = null;

    prismaStub.qualityFinding = {
      findMany: async (args: any) => {
        capturedQuery = args;
        return [];
      },
    };

    await complianceService.listQualityFindings('tenant-a');

    assert.deepEqual(capturedQuery?.where?.OR, [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ]);
  });

  it('blocks tenant A from mutating tenant B quality findings', async () => {
    prismaStub.qualityFinding = {
      findUnique: async () => ({
        id: 'finding-1',
        document: { tenantId: 'tenant-b' },
        generationJob: null,
      }),
    };

    await assert.rejects(
      () => complianceService.assertQualityFindingTenantAccess('finding-1', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      }
    );
  });

  it('blocks quality checks for documents outside tenant scope', async () => {
    prismaStub.document = {
      findUnique: async () => ({
        id: 'doc-1',
        title: 'Forbidden Doc',
        category: 'SERVER',
        content: 'owner review',
        tenantId: 'tenant-b',
      }),
    };

    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      }
    );
  });

  it('continues to generate findings for tenant-owned documents', async () => {
    let deleteManyCalled = false;
    let createManyPayload: any = null;

    prismaStub.document = {
      findUnique: async () => ({
        id: 'doc-1',
        title: 'Owned Doc',
        category: 'SECURITY',
        content: 'password: hunter2',
        tenantId: 'tenant-a',
      }),
    };

    prismaStub.qualityFinding = {
      deleteMany: async () => {
        deleteManyCalled = true;
        return { count: 1 };
      },
      createMany: async (args: any) => {
        createManyPayload = args;
        return { count: args?.data?.length ?? 0 };
      },
    };

    const findings = await complianceService.runQualityChecks('doc-1', 'tenant-a');

    assert.equal(deleteManyCalled, true);
    assert.ok(findings.some((finding) => finding.severity === 'ERROR'));
    assert.equal(createManyPayload?.data?.every((row: any) => row.documentId === 'doc-1'), true);
  });
});
