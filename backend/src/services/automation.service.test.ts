import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { automationService } from './automation.service.js';

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

test('approveJobForTenant blocks cross-tenant approvals', async (t) => {
  let updateCalled = false;
  const restoreFindUnique = stubPrismaMethod(['generationJob', 'findUnique'], async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  }));
  const restoreUpdate = stubPrismaMethod(['generationJob', 'update'], async () => {
    updateCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  });

  t.after(() => {
    restoreUpdate();
    restoreFindUnique();
  });

  await assert.rejects(
    () => automationService.approveJobForTenant('job-1', 'tenant-a'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('nicht erlaubt'),
  );
  assert.equal(updateCalled, false);
});

test('updateSuggestion blocks cross-tenant changes', async (t) => {
  let updateCalled = false;
  const restoreFindUnique = stubPrismaMethod(['updateSuggestion', 'findUnique'], async () => ({
    id: 'suggestion-1',
    generationJob: {
      tenantId: 'tenant-b',
    },
  }));
  const restoreUpdate = stubPrismaMethod(['updateSuggestion', 'update'], async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  });

  t.after(() => {
    restoreUpdate();
    restoreFindUnique();
  });

  await assert.rejects(
    () =>
      automationService.updateSuggestion(
        'suggestion-1',
        { status: 'APPLIED', resolution: 'done' },
        'tenant-a',
      ),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('nicht erlaubt'),
  );
  assert.equal(updateCalled, false);
});
