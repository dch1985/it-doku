import test from 'node:test';
import assert from 'node:assert/strict';
import { automationService } from '../automation.service.js';
import { complianceService } from '../compliance.service.js';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';

test('automation approveJob blocks cross-tenant approval', async () => {
  const prismaAny = prisma as any;
  const originalFindUnique = prismaAny.generationJob.findUnique;
  const originalUpdate = prismaAny.generationJob.update;

  let updateCalled = false;

  prismaAny.generationJob.findUnique = async () => ({ id: 'job-1', tenantId: 'tenant-b' });
  prismaAny.generationJob.update = async () => {
    updateCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  };

  try {
    await assert.rejects(
      async () => automationService.approveJob('job-1', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal((error as ApplicationError).statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaAny.generationJob.findUnique = originalFindUnique;
    prismaAny.generationJob.update = originalUpdate;
  }
});

test('automation updateSuggestion blocks cross-tenant updates', async () => {
  const prismaAny = prisma as any;
  const originalFindUnique = prismaAny.updateSuggestion.findUnique;
  const originalUpdate = prismaAny.updateSuggestion.update;

  let updateCalled = false;

  prismaAny.updateSuggestion.findUnique = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-b' },
  });
  prismaAny.updateSuggestion.update = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  try {
    await assert.rejects(
      async () =>
        automationService.updateSuggestion(
          'suggestion-1',
          { status: 'APPLIED', resolution: 'ok' },
          'tenant-a',
        ),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal((error as ApplicationError).statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaAny.updateSuggestion.findUnique = originalFindUnique;
    prismaAny.updateSuggestion.update = originalUpdate;
  }
});

test('compliance updateQualityFinding blocks cross-tenant mutation', async () => {
  const prismaAny = prisma as any;
  const originalFindUnique = prismaAny.qualityFinding.findUnique;
  const originalUpdate = prismaAny.qualityFinding.update;

  let updateCalled = false;

  prismaAny.qualityFinding.findUnique = async () => ({
    id: 'finding-1',
    generationJob: { tenantId: 'tenant-b' },
    document: null,
  });
  prismaAny.qualityFinding.update = async () => {
    updateCalled = true;
    return { id: 'finding-1' };
  };

  try {
    await assert.rejects(
      async () =>
        complianceService.updateQualityFinding(
          'finding-1',
          { action: 'RESOLVE', resolution: 'done' },
          'tenant-a',
        ),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal((error as ApplicationError).statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaAny.qualityFinding.findUnique = originalFindUnique;
    prismaAny.qualityFinding.update = originalUpdate;
  }
});

test('compliance runQualityChecks blocks cross-tenant document access', async () => {
  const prismaAny = prisma as any;
  const originalFindUnique = prismaAny.document.findUnique;

  prismaAny.document.findUnique = async () => ({
    id: 'doc-1',
    title: 'Doc',
    category: 'SECURITY',
    content: 'review owner section',
    tenantId: 'tenant-b',
  });

  try {
    await assert.rejects(
      async () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal((error as ApplicationError).statusCode, 403);
        return true;
      },
    );
  } finally {
    prismaAny.document.findUnique = originalFindUnique;
  }
});
