import assert from 'node:assert/strict';
import test from 'node:test';

import automationRouter from '../src/routes/automation.js';
import complianceRouter from '../src/routes/compliance.js';
import { prisma } from '../src/lib/prisma.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';
import { automationService } from '../src/services/automation.service.js';
import { complianceService } from '../src/services/compliance.service.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function getRouteHandler(router: any, path: string, method: string) {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );

  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} route to exist`);
  return layer.route.stack[0].handle as (req: any, res: any) => Promise<void>;
}

test('PATCH /compliance/reviews/:id keeps comments unchanged when omitted', async () => {
  const handler = getRouteHandler(complianceRouter, '/reviews/:id', 'patch');
  const originalUpdate = complianceService.updateReviewRequest;
  let receivedPayload: any = null;

  complianceService.updateReviewRequest = (async (_id: string, payload: any) => {
    receivedPayload = payload;
    return { id: 'review-1' } as any;
  }) as typeof complianceService.updateReviewRequest;

  const req = {
    params: { id: 'review-1' },
    body: { status: 'APPROVED' },
    tenant: { id: 'tenant-1' },
    user: { id: 'reviewer-1' },
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(receivedPayload.comments, undefined);
    assert.equal(receivedPayload.actorUserId, 'reviewer-1');
  } finally {
    complianceService.updateReviewRequest = originalUpdate;
  }
});

test('PATCH /compliance/reviews/:id rejects unauthenticated update attempts', async () => {
  const handler = getRouteHandler(complianceRouter, '/reviews/:id', 'patch');
  const originalUpdate = complianceService.updateReviewRequest;
  let called = false;

  complianceService.updateReviewRequest = (async () => {
    called = true;
    return { id: 'review-1' } as any;
  }) as typeof complianceService.updateReviewRequest;

  const req = {
    params: { id: 'review-1' },
    body: { status: 'APPROVED' },
    tenant: { id: 'tenant-1' },
    user: undefined,
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(called, false);
  } finally {
    complianceService.updateReviewRequest = originalUpdate;
  }
});

test('complianceService.updateReviewRequest blocks non-reviewers', async () => {
  const prismaAny = prisma as any;
  const originalReviewRequest = prismaAny.reviewRequest;
  let updateCalled = false;

  prismaAny.reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async () => {
      updateCalled = true;
      return { id: 'review-1' };
    },
  };

  try {
    await assert.rejects(
      () =>
        complianceService.updateReviewRequest('review-1', {
          status: 'APPROVED',
          tenantId: 'tenant-1',
          actorUserId: 'intruder-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(updateCalled, false);
  } finally {
    prismaAny.reviewRequest = originalReviewRequest;
  }
});

test('complianceService.listQualityFindings scopes query to active tenant', async () => {
  const prismaAny = prisma as any;
  const originalQualityFinding = prismaAny.qualityFinding;
  let capturedArgs: any = null;

  prismaAny.qualityFinding = {
    findMany: async (args: any) => {
      capturedArgs = args;
      return [];
    },
  };

  try {
    await complianceService.listQualityFindings('tenant-1', 'doc-1');
    assert.equal(capturedArgs.where.documentId, 'doc-1');
    assert.deepEqual(capturedArgs.where.OR, [
      { document: { tenantId: 'tenant-1' } },
      { document: { tenantId: null } },
      { generationJob: { tenantId: 'tenant-1' } },
    ]);
  } finally {
    prismaAny.qualityFinding = originalQualityFinding;
  }
});

test('complianceService.runQualityChecks rejects cross-tenant document access', async () => {
  const prismaAny = prisma as any;
  const originalDocument = prismaAny.document;
  const originalQualityFinding = prismaAny.qualityFinding;
  let deleteCalled = false;
  let createCalled = false;

  prismaAny.document = {
    findUnique: async () => ({
      id: 'doc-1',
      title: 'Tenant A Doc',
      content: 'owner: team-a',
      category: 'SECURITY',
      tenantId: 'tenant-a',
    }),
  };

  prismaAny.qualityFinding = {
    deleteMany: async () => {
      deleteCalled = true;
      return { count: 0 };
    },
    createMany: async () => {
      createCalled = true;
      return { count: 0 };
    },
  };

  try {
    await assert.rejects(
      () => complianceService.runQualityChecks('doc-1', 'tenant-b'),
      (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
    assert.equal(deleteCalled, false);
    assert.equal(createCalled, false);
  } finally {
    prismaAny.document = originalDocument;
    prismaAny.qualityFinding = originalQualityFinding;
  }
});

test('POST /automation/jobs/:id/approve blocks cross-tenant approval', async () => {
  const handler = getRouteHandler(automationRouter, '/jobs/:id/approve', 'post');
  const originalGetJob = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;
  let approveCalled = false;

  automationService.getJobWithDetails = (async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  })) as typeof automationService.getJobWithDetails;

  automationService.approveJob = (async () => {
    approveCalled = true;
    return { id: 'job-1' } as any;
  }) as typeof automationService.approveJob;

  const req = {
    params: { id: 'job-1' },
    tenant: { id: 'tenant-a' },
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(approveCalled, false);
  } finally {
    automationService.getJobWithDetails = originalGetJob;
    automationService.approveJob = originalApproveJob;
  }
});

test('PATCH /automation/suggestions/:id blocks cross-tenant suggestion updates', async () => {
  const handler = getRouteHandler(automationRouter, '/suggestions/:id', 'patch');
  const originalGetSuggestion = automationService.getSuggestionWithContext;
  const originalUpdateSuggestion = automationService.updateSuggestion;
  let updateCalled = false;

  automationService.getSuggestionWithContext = (async () => ({
    id: 'sugg-1',
    generationJob: { id: 'job-1', tenantId: 'tenant-b' },
  })) as typeof automationService.getSuggestionWithContext;

  automationService.updateSuggestion = (async () => {
    updateCalled = true;
    return { id: 'sugg-1' } as any;
  }) as typeof automationService.updateSuggestion;

  const req = {
    params: { id: 'sugg-1' },
    body: { status: 'APPLIED' },
    tenant: { id: 'tenant-a' },
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(updateCalled, false);
  } finally {
    automationService.getSuggestionWithContext = originalGetSuggestion;
    automationService.updateSuggestion = originalUpdateSuggestion;
  }
});
