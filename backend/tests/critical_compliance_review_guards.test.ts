import assert from 'node:assert/strict';
import test from 'node:test';

import { prisma } from '../src/lib/prisma.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';
import complianceRouter from '../src/routes/compliance.js';
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
    body: { status: 'approved' },
    tenant: { id: 'tenant-1' },
    user: { id: 'reviewer-1' },
  };
  const res = createResponse();

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(receivedPayload.status, 'APPROVED');
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

test('complianceService.updateReviewRequest keeps existing comments when omitted', async () => {
  const prismaAny = prisma as any;
  const originalReviewRequest = prismaAny.reviewRequest;
  let updateArgs: any = null;

  prismaAny.reviewRequest = {
    findUnique: async () => ({
      id: 'review-1',
      reviewerId: 'reviewer-1',
      document: { tenantId: 'tenant-1' },
    }),
    update: async (args: any) => {
      updateArgs = args;
      return { id: 'review-1' };
    },
  };

  try {
    await complianceService.updateReviewRequest('review-1', {
      status: 'APPROVED',
      tenantId: 'tenant-1',
      actorUserId: 'reviewer-1',
    });

    assert.equal(updateArgs?.data?.status, 'APPROVED');
    assert.equal(
      Object.prototype.hasOwnProperty.call(updateArgs?.data ?? {}, 'comments'),
      false,
    );
  } finally {
    prismaAny.reviewRequest = originalReviewRequest;
  }
});
