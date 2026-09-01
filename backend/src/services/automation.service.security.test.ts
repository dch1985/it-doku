import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { automationService } from './automation.service.js';

function patchPrismaDelegate(delegateName: string, mock: unknown): () => void {
  const prismaAny = prisma as Record<string, unknown>;
  const original = prismaAny[delegateName];
  prismaAny[delegateName] = mock;
  return () => {
    prismaAny[delegateName] = original;
  };
}

test('automation service tenant ownership guards', async (t) => {
  await t.test('approveJob rejects cross-tenant requests', async () => {
    let updateCalled = false;
    const restoreGenerationJob = patchPrismaDelegate('generationJob', {
      findUnique: async () => ({ id: 'job-1', tenantId: 'tenant-b' }),
      update: async () => {
        updateCalled = true;
        return { id: 'job-1', status: 'COMPLETED' };
      },
    });

    try {
      await assert.rejects(
        () => automationService.approveJob('job-1', 'tenant-a'),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 404 &&
          error.message.includes('Job nicht gefunden'),
      );
      assert.equal(updateCalled, false);
    } finally {
      restoreGenerationJob();
    }
  });

  await t.test('approveJob allows same-tenant requests', async () => {
    const restoreGenerationJob = patchPrismaDelegate('generationJob', {
      findUnique: async () => ({ id: 'job-1', tenantId: 'tenant-a' }),
      update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
        id: where.id,
        status: data.status,
      }),
    });

    try {
      const result = await automationService.approveJob('job-1', 'tenant-a');
      assert.equal(result?.id, 'job-1');
      assert.equal(result?.status, 'COMPLETED');
    } finally {
      restoreGenerationJob();
    }
  });

  await t.test('updateSuggestion rejects cross-tenant requests', async () => {
    let updateCalled = false;
    const restoreUpdateSuggestion = patchPrismaDelegate('updateSuggestion', {
      findUnique: async () => ({
        id: 'suggestion-1',
        generationJob: { tenantId: 'tenant-b' },
      }),
      update: async () => {
        updateCalled = true;
        return { id: 'suggestion-1', status: 'APPLIED' };
      },
    });

    try {
      await assert.rejects(
        () => automationService.updateSuggestion('suggestion-1', { status: 'applied' }, 'tenant-a'),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 404 &&
          error.message.includes('Vorschlag nicht gefunden'),
      );
      assert.equal(updateCalled, false);
    } finally {
      restoreUpdateSuggestion();
    }
  });

  await t.test('updateSuggestion allows same-tenant requests', async () => {
    const restoreUpdateSuggestion = patchPrismaDelegate('updateSuggestion', {
      findUnique: async () => ({
        id: 'suggestion-1',
        generationJob: { tenantId: 'tenant-a' },
      }),
      update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
        id: where.id,
        status: data.status,
      }),
    });

    try {
      const result = await automationService.updateSuggestion(
        'suggestion-1',
        { status: 'applied' },
        'tenant-a',
      );
      assert.equal(result?.id, 'suggestion-1');
      assert.equal(result?.status, 'APPLIED');
    } finally {
      restoreUpdateSuggestion();
    }
  });
});
