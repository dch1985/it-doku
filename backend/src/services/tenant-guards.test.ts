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

function ensureDelegate(delegateName: string) {
  const prismaObject = prisma as unknown as Record<string, unknown>;
  const hadOwnDelegate = Object.prototype.hasOwnProperty.call(prismaObject, delegateName);
  const originalDelegate = prismaObject[delegateName];

  if (!originalDelegate || typeof originalDelegate !== 'object') {
    prismaObject[delegateName] = {};
  }

  return {
    delegate: prismaObject[delegateName] as Record<string, unknown>,
    restore: () => {
      if (hadOwnDelegate) {
        prismaObject[delegateName] = originalDelegate;
      } else {
        delete prismaObject[delegateName];
      }
    },
  };
}

test('approveJob blocks cross-tenant job approval', async () => {
  const generationJobDelegate = ensureDelegate('generationJob');
  const generationJob = generationJobDelegate.delegate;
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
    generationJobDelegate.restore();
  }
});

test('updateSuggestion blocks cross-tenant suggestion updates', async () => {
  const updateSuggestionDelegate = ensureDelegate('updateSuggestion');
  const updateSuggestion = updateSuggestionDelegate.delegate;
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
    updateSuggestionDelegate.restore();
  }
});

test('listQualityFindings applies tenant scope in query', async () => {
  const qualityFindingDelegate = ensureDelegate('qualityFinding');
  const qualityFinding = qualityFindingDelegate.delegate;
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
    qualityFindingDelegate.restore();
  }
});

test('updateQualityFinding blocks cross-tenant finding updates', async () => {
  const qualityFindingDelegate = ensureDelegate('qualityFinding');
  const qualityFinding = qualityFindingDelegate.delegate;
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
    qualityFindingDelegate.restore();
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
