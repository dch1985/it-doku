import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { automationService } from './automation.service.js';
import { complianceService } from './compliance.service.js';

const restoreFns: Array<() => void> = [];
const createdDelegates = new Set<string>();

function patchMethod(target: Record<string, unknown>, key: string, replacement: unknown) {
  const original = target[key];
  target[key] = replacement;
  restoreFns.push(() => {
    target[key] = original;
  });
}

function getDelegate(name: string): Record<string, unknown> {
  const client = prisma as any;
  if (!client[name]) {
    client[name] = {};
    createdDelegates.add(name);
  }
  return client[name] as Record<string, unknown>;
}

afterEach(() => {
  while (restoreFns.length > 0) {
    const restore = restoreFns.pop();
    restore?.();
  }

  if (createdDelegates.size > 0) {
    const client = prisma as any;
    for (const delegateName of createdDelegates) {
      delete client[delegateName];
    }
    createdDelegates.clear();
  }
});

test('complianceService.updateQualityFinding rejects cross-tenant updates', async () => {
  let updateCalled = false;
  const qualityFindingDelegate = getDelegate('qualityFinding');

  patchMethod(qualityFindingDelegate, 'findUnique', async () => ({
    id: 'finding-1',
    document: { tenantId: 'tenant-b' },
    generationJob: null,
  }));
  patchMethod(qualityFindingDelegate, 'update', async () => {
    updateCalled = true;
    return { id: 'finding-1' };
  });

  await assert.rejects(
    () =>
      complianceService.updateQualityFinding('finding-1', {
        tenantId: 'tenant-a',
        action: 'RESOLVE',
      }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      /nicht erlaubt/i.test(error.message),
  );

  assert.equal(updateCalled, false);
});

test('complianceService.runQualityChecks rejects cross-tenant document checks before mutation', async () => {
  let deleteCalled = false;
  let createManyCalled = false;
  const documentDelegate = getDelegate('document');
  const qualityFindingDelegate = getDelegate('qualityFinding');

  patchMethod(documentDelegate, 'findUnique', async () => ({
    id: 'doc-1',
    tenantId: 'tenant-b',
    title: 'Foreign document',
    content: '<p>test</p>',
    category: 'SECURITY',
  }));
  patchMethod(qualityFindingDelegate, 'deleteMany', async () => {
    deleteCalled = true;
    return { count: 0 };
  });
  patchMethod(qualityFindingDelegate, 'createMany', async () => {
    createManyCalled = true;
    return { count: 0 };
  });

  await assert.rejects(
    () => complianceService.runQualityChecks('doc-1', 'tenant-a'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      /nicht erlaubt/i.test(error.message),
  );

  assert.equal(deleteCalled, false);
  assert.equal(createManyCalled, false);
});

test('automationService.approveJob rejects cross-tenant job approval', async () => {
  let updateCalled = false;
  const generationJobDelegate = getDelegate('generationJob');

  patchMethod(generationJobDelegate, 'findUnique', async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  }));
  patchMethod(generationJobDelegate, 'update', async () => {
    updateCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  });

  await assert.rejects(
    () => automationService.approveJob('job-1', 'tenant-a'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      /nicht erlaubt/i.test(error.message),
  );

  assert.equal(updateCalled, false);
});

test('automationService.updateSuggestion rejects cross-tenant suggestion updates', async () => {
  let updateCalled = false;
  const suggestionDelegate = getDelegate('updateSuggestion');

  patchMethod(suggestionDelegate, 'findUnique', async () => ({
    id: 'sug-1',
    generationJob: { tenantId: 'tenant-b' },
  }));
  patchMethod(suggestionDelegate, 'update', async () => {
    updateCalled = true;
    return { id: 'sug-1', status: 'APPLIED' };
  });

  await assert.rejects(
    () =>
      automationService.updateSuggestion(
        'sug-1',
        { status: 'APPLIED', resolution: 'Looks good' },
        'tenant-a',
      ),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      /nicht erlaubt/i.test(error.message),
  );

  assert.equal(updateCalled, false);
});
