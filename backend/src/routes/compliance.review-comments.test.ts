import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

const { default: complianceRouter } = await import('./compliance.js');
const { complianceService } = await import('../services/compliance.service.js');
const { prisma } = await import('../lib/prisma.js');

type ReviewUpdatePayload = Parameters<typeof complianceService.updateReviewRequest>[1];

async function withComplianceServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Server address could not be determined');
  }

  const baseUrl = `http://localhost:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

function mockDevAuthUser() {
  const originalFindFirst = prisma.user.findFirst;
  (prisma.user as any).findFirst = async () => ({
    id: 'test-user-id',
    email: 'tester@example.com',
    name: 'Test User',
    role: 'ADMIN',
  });

  return () => {
    (prisma.user as any).findFirst = originalFindFirst;
  };
}

test('PATCH /api/compliance/reviews/:id does not clear comments when omitted', async () => {
  const restoreDevAuth = mockDevAuthUser();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: ReviewUpdatePayload | undefined;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: ReviewUpdatePayload) => {
    capturedPayload = payload;
    return {
      id: 'review-1',
      status: payload.status ?? 'PENDING',
      comments: 'existing comments',
    };
  };

  try {
    await withComplianceServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/compliance/reviews/review-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
        }),
      });

      assert.equal(response.status, 200);
    });

    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload ?? {}, 'comments'), false);
  } finally {
    restoreDevAuth();
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /api/compliance/reviews/:id keeps explicit null comment updates', async () => {
  const restoreDevAuth = mockDevAuthUser();
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: ReviewUpdatePayload | undefined;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: ReviewUpdatePayload) => {
    capturedPayload = payload;
    return {
      id: 'review-2',
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? null,
    };
  };

  try {
    await withComplianceServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/compliance/reviews/review-2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'changes_requested',
          comments: null,
        }),
      });

      assert.equal(response.status, 200);
    });

    assert.equal(capturedPayload?.status, 'CHANGES_REQUESTED');
    assert.equal(capturedPayload?.comments, null);
  } finally {
    restoreDevAuth();
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
