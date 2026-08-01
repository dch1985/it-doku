import test from 'node:test';
import assert from 'node:assert/strict';

import { automationService } from './automation.service.js';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

test('approveJob rejects cross-tenant approvals', { concurrency: false }, async () => {
  const prismaClient = prisma as any;
  const originalGenerationJob = prismaClient.generationJob;
  let updateCalled = false;

  prismaClient.generationJob = {
    ...(originalGenerationJob ?? {}),
    findUnique: async () => ({ id: 'job-1', tenantId: 'tenant-b' }),
    update: async () => {
      updateCalled = true;
      return { id: 'job-1', status: 'COMPLETED' };
    },
  };

  try {
    await assert.rejects(automationService.approveJob('job-1', 'tenant-a'), (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    });
    assert.equal(updateCalled, false);
  } finally {
    prismaClient.generationJob = originalGenerationJob;
  }
});

test('approveJob allows matching-tenant approvals', { concurrency: false }, async () => {
  const prismaClient = prisma as any;
  const originalGenerationJob = prismaClient.generationJob;
  const updateCalls: any[] = [];

  prismaClient.generationJob = {
    ...(originalGenerationJob ?? {}),
    findUnique: async () => ({ id: 'job-2', tenantId: 'tenant-a' }),
    update: async (args: any) => {
      updateCalls.push(args);
      return { id: 'job-2', status: 'COMPLETED', completedAt: new Date() };
    },
  };

  try {
    const result = await automationService.approveJob('job-2', 'tenant-a');
    assert.equal(result.status, 'COMPLETED');
    assert.equal(updateCalls.length, 1);
    assert.deepEqual(updateCalls[0].where, { id: 'job-2' });
  } finally {
    prismaClient.generationJob = originalGenerationJob;
  }
});

test('updateSuggestion rejects cross-tenant updates', { concurrency: false }, async () => {
  const prismaClient = prisma as any;
  const originalUpdateSuggestion = prismaClient.updateSuggestion;
  let updateCalled = false;

  prismaClient.updateSuggestion = {
    ...(originalUpdateSuggestion ?? {}),
    findUnique: async () => ({
      id: 'suggestion-1',
      generationJob: { tenantId: 'tenant-b' },
    }),
    update: async () => {
      updateCalled = true;
      return { id: 'suggestion-1', status: 'APPLIED' };
    },
  };

  try {
    await assert.rejects(
      automationService.updateSuggestion('suggestion-1', { status: 'applied' }, 'tenant-a'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      }
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaClient.updateSuggestion = originalUpdateSuggestion;
  }
});

test('updateSuggestion allows matching-tenant updates', { concurrency: false }, async () => {
  const prismaClient = prisma as any;
  const originalUpdateSuggestion = prismaClient.updateSuggestion;
  let updateArgs: any | null = null;

  prismaClient.updateSuggestion = {
    ...(originalUpdateSuggestion ?? {}),
    findUnique: async () => ({
      id: 'suggestion-2',
      generationJob: { tenantId: 'tenant-a' },
    }),
    update: async (args: any) => {
      updateArgs = args;
      return { id: 'suggestion-2', status: 'APPLIED', resolvedAt: new Date() };
    },
  };

  try {
    const result = await automationService.updateSuggestion(
      'suggestion-2',
      { status: 'applied', resolution: 'validated' },
      'tenant-a'
    );

    assert.equal(result.status, 'APPLIED');
    assert.ok(updateArgs);
    assert.equal(updateArgs.data.status, 'APPLIED');
    assert.equal(typeof updateArgs.data.metadata, 'string');
    assert.ok(updateArgs.data.resolvedAt instanceof Date);
  } finally {
    prismaClient.updateSuggestion = originalUpdateSuggestion;
  }
});
