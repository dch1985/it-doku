import assert from 'node:assert/strict';
import test from 'node:test';

import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { automationService } from './automation.service.js';
import { complianceService } from './compliance.service.js';

function swapMethod(target: Record<string, unknown>, key: string, replacement: unknown) {
  const original = target[key];
  target[key] = replacement;

  return () => {
    target[key] = original;
  };
}

test('approveJob blocks cross-tenant job approval', async () => {
  const generationJob = prisma.generationJob as unknown as Record<string, unknown>;
  const restoreFindUnique = swapMethod(generationJob, 'findUnique', async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  }));
  const restoreUpdate = swapMethod(generationJob, 'update', async () => {
    throw new Error('update should not be called for cross-tenant approval');
  });

  try {
    await assert.rejects(
      () => automationService.approveJob('job-1', 'tenant-a'),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 404 &&
        error.message === 'Job nicht gefunden',
    );
  } finally {
    restoreFindUnique();
    restoreUpdate();
  }
});

test('updateSuggestion blocks cross-tenant suggestion updates', async () => {
  const updateSuggestion = prisma.updateSuggestion as unknown as Record<string, unknown>;
  const restoreFindUnique = swapMethod(updateSuggestion, 'findUnique', async () => ({
    id: 'suggestion-1',
    generationJob: {
      id: 'job-2',
      tenantId: 'tenant-b',
    },
  }));
  const restoreUpdate = swapMethod(updateSuggestion, 'update', async () => {
    throw new Error('update should not be called for cross-tenant suggestion updates');
  });

  try {
    await assert.rejects(
      () =>
        automationService.updateSuggestion(
          'suggestion-1',
          {
            status: 'APPLIED',
          },
          'tenant-a',
        ),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 404 &&
        error.message === 'Suggestion nicht gefunden',
    );
  } finally {
    restoreFindUnique();
    restoreUpdate();
  }
});

test('listQualityFindings applies tenant scope in query', async () => {
  const qualityFinding = prisma.qualityFinding as unknown as Record<string, unknown>;
  let capturedWhere: unknown;

  const restoreFindMany = swapMethod(qualityFinding, 'findMany', async (args: any) => {
    capturedWhere = args.where;
    return [];
  });

  try {
    await complianceService.listQualityFindings(undefined, 'tenant-a');

    assert.deepEqual(capturedWhere, {
      OR: [
        { document: { tenantId: 'tenant-a' } },
        { generationJob: { tenantId: 'tenant-a' } },
      ],
    });
  } finally {
    restoreFindMany();
  }
});

test('updateQualityFinding blocks cross-tenant finding updates', async () => {
  const qualityFinding = prisma.qualityFinding as unknown as Record<string, unknown>;
  const restoreFindUnique = swapMethod(qualityFinding, 'findUnique', async () => ({
    id: 'finding-1',
    document: {
      tenantId: 'tenant-b',
    },
    generationJob: null,
  }));
  const restoreUpdate = swapMethod(qualityFinding, 'update', async () => {
    throw new Error('update should not be called for cross-tenant finding updates');
  });

  try {
    await assert.rejects(
      () =>
        complianceService.updateQualityFinding(
          'finding-1',
          {
            action: 'RESOLVE',
            resolution: 'resolved',
          },
          'tenant-a',
        ),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 404 &&
        error.message === 'Quality Finding wurde nicht gefunden',
    );
  } finally {
    restoreFindUnique();
    restoreUpdate();
  }
});

test('runQualityChecks blocks cross-tenant document access', async () => {
  const document = prisma.document as unknown as Record<string, unknown>;
  const restoreFindUnique = swapMethod(document, 'findUnique', async () => ({
    id: 'document-1',
    content: 'test content',
    title: 'Test',
    category: 'SECURITY',
    tenantId: 'tenant-b',
  }));

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('document-1', 'tenant-a'),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 403 &&
        error.message === 'Zugriff auf dieses Dokument ist nicht erlaubt',
    );
  } finally {
    restoreFindUnique();
  }
});
