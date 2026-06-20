import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';
import { complianceService } from '../compliance.service.js';

const prismaClient = prisma as any;

test('listQualityFindings scopes query to tenant relations', async (t) => {
  const originalFindMany = prismaClient.qualityFinding.findMany;

  let receivedWhere: Record<string, unknown> | null = null;
  prismaClient.qualityFinding.findMany = async ({ where }: { where: Record<string, unknown> }) => {
    receivedWhere = where;
    return [];
  };

  t.after(() => {
    prismaClient.qualityFinding.findMany = originalFindMany;
  });

  await complianceService.listQualityFindings('tenant-a');

  assert.deepEqual(receivedWhere, {
    OR: [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ],
  });
});

test('updateQualityFinding denies access to other tenant finding', async (t) => {
  const originalFindUnique = prismaClient.qualityFinding.findUnique;
  const originalUpdate = prismaClient.qualityFinding.update;

  prismaClient.qualityFinding.findUnique = async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  });

  let updateCalled = false;
  prismaClient.qualityFinding.update = async () => {
    updateCalled = true;
    return {};
  };

  t.after(() => {
    prismaClient.qualityFinding.findUnique = originalFindUnique;
    prismaClient.qualityFinding.update = originalUpdate;
  });

  await assert.rejects(
    complianceService.updateQualityFinding(
      'finding-1',
      { action: 'RESOLVE', resolution: 'Done' },
      'tenant-a',
    ),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );

  assert.equal(updateCalled, false);
});

test('runQualityChecks denies access when document belongs to another tenant', async (t) => {
  const originalFindUnique = prismaClient.document.findUnique;

  prismaClient.document.findUnique = async () => ({
    id: 'doc-1',
    title: 'Doc',
    category: 'SECURITY',
    content: 'review and owner',
    tenantId: 'tenant-b',
  });

  t.after(() => {
    prismaClient.document.findUnique = originalFindUnique;
  });

  await assert.rejects(
    complianceService.runQualityChecks('doc-1', 'tenant-a'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

