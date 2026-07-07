import test from 'node:test';
import assert from 'node:assert/strict';
import { automationService } from '../automation.service.js';
import { complianceService } from '../compliance.service.js';
import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';

function ensureModel(prismaClient: any, modelName: string) {
  const hadModel = Object.prototype.hasOwnProperty.call(prismaClient, modelName);
  const originalModel = prismaClient[modelName];

  if (!prismaClient[modelName]) {
    prismaClient[modelName] = {};
  }

  return {
    model: prismaClient[modelName] as Record<string, unknown>,
    restore: () => {
      if (hadModel) {
        prismaClient[modelName] = originalModel;
      } else {
        delete prismaClient[modelName];
      }
    },
  };
}

test('automation approveJob blocks cross-tenant approval', async () => {
  const prismaAny = prisma as any;
  const generationJob = ensureModel(prismaAny, 'generationJob');
  const originalFindUnique = generationJob.model.findUnique;
  const originalUpdate = generationJob.model.update;

  let updateCalled = false;

  generationJob.model.findUnique = async () => ({ id: 'job-1', tenantId: 'tenant-b' });
  generationJob.model.update = async () => {
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
    generationJob.model.findUnique = originalFindUnique;
    generationJob.model.update = originalUpdate;
    generationJob.restore();
  }
});

test('automation updateSuggestion blocks cross-tenant updates', async () => {
  const prismaAny = prisma as any;
  const updateSuggestion = ensureModel(prismaAny, 'updateSuggestion');
  const originalFindUnique = updateSuggestion.model.findUnique;
  const originalUpdate = updateSuggestion.model.update;

  let updateCalled = false;

  updateSuggestion.model.findUnique = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-b' },
  });
  updateSuggestion.model.update = async () => {
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
    updateSuggestion.model.findUnique = originalFindUnique;
    updateSuggestion.model.update = originalUpdate;
    updateSuggestion.restore();
  }
});

test('compliance updateQualityFinding blocks cross-tenant mutation', async () => {
  const prismaAny = prisma as any;
  const qualityFinding = ensureModel(prismaAny, 'qualityFinding');
  const originalFindUnique = qualityFinding.model.findUnique;
  const originalUpdate = qualityFinding.model.update;

  let updateCalled = false;

  qualityFinding.model.findUnique = async () => ({
    id: 'finding-1',
    generationJob: { tenantId: 'tenant-b' },
    document: null,
  });
  qualityFinding.model.update = async () => {
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
    qualityFinding.model.findUnique = originalFindUnique;
    qualityFinding.model.update = originalUpdate;
    qualityFinding.restore();
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
