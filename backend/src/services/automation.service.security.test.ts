import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { automationService } from './automation.service.js';

test('approveJob blocks cross-tenant mutation attempts', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.generationJob);
  const delegate = prismaAny.generationJob ?? (prismaAny.generationJob = {});
  const originalFindUnique = delegate.findUnique;
  const originalUpdate = delegate.update;
  let updateCalled = false;

  delegate.findUnique = async () => ({ id: 'job-1', tenantId: 'tenant-b' });
  delegate.update = async () => {
    updateCalled = true;
    return { id: 'job-1' };
  };

  try {
    await assert.rejects(
      () => automationService.approveJob('job-1', 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 404);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    delegate.findUnique = originalFindUnique;
    delegate.update = originalUpdate;
    if (!hadDelegate) {
      delete prismaAny.generationJob;
    }
  }
});

test('approveJob allows same-tenant updates', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.generationJob);
  const delegate = prismaAny.generationJob ?? (prismaAny.generationJob = {});
  const originalFindUnique = delegate.findUnique;
  const originalUpdate = delegate.update;

  delegate.findUnique = async () => ({ id: 'job-1', tenantId: 'tenant-a' });
  delegate.update = async ({ where, data }: any) => ({
    id: where.id,
    tenantId: 'tenant-a',
    status: data.status,
    completedAt: data.completedAt,
  });

  try {
    const result = await automationService.approveJob('job-1', 'tenant-a');
    assert.equal(result?.id, 'job-1');
    assert.equal(result?.status, 'COMPLETED');
    assert.ok(result?.completedAt instanceof Date);
  } finally {
    delegate.findUnique = originalFindUnique;
    delegate.update = originalUpdate;
    if (!hadDelegate) {
      delete prismaAny.generationJob;
    }
  }
});

test('updateSuggestion blocks cross-tenant mutation attempts', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.updateSuggestion);
  const delegate = prismaAny.updateSuggestion ?? (prismaAny.updateSuggestion = {});
  const originalFindUnique = delegate.findUnique;
  const originalUpdate = delegate.update;
  let updateCalled = false;

  delegate.findUnique = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-b' },
  });
  delegate.update = async () => {
    updateCalled = true;
    return { id: 'suggestion-1' };
  };

  try {
    await assert.rejects(
      () => automationService.updateSuggestion('suggestion-1', { status: 'APPLIED' }, 'tenant-a'),
      (error: any) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 404);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    delegate.findUnique = originalFindUnique;
    delegate.update = originalUpdate;
    if (!hadDelegate) {
      delete prismaAny.updateSuggestion;
    }
  }
});

test('updateSuggestion allows same-tenant updates', async () => {
  const prismaAny = prisma as any;
  const hadDelegate = Boolean(prismaAny.updateSuggestion);
  const delegate = prismaAny.updateSuggestion ?? (prismaAny.updateSuggestion = {});
  const originalFindUnique = delegate.findUnique;
  const originalUpdate = delegate.update;

  delegate.findUnique = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-a' },
  });
  delegate.update = async ({ where, data }: any) => ({
    id: where.id,
    status: data.status,
    metadata: data.metadata,
    resolvedAt: data.resolvedAt,
  });

  try {
    const result = await automationService.updateSuggestion(
      'suggestion-1',
      { status: 'APPLIED', resolution: 'Looks good' },
      'tenant-a',
    );
    assert.equal(result?.id, 'suggestion-1');
    assert.equal(result?.status, 'APPLIED');
    assert.ok(result?.resolvedAt instanceof Date);
  } finally {
    delegate.findUnique = originalFindUnique;
    delegate.update = originalUpdate;
    if (!hadDelegate) {
      delete prismaAny.updateSuggestion;
    }
  }
});
