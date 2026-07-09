import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import type { Server } from 'node:http';
import express from 'express';
import type { ReviewRequestUpdatePayload } from '../services/compliance.service.js';
import { complianceService } from '../services/compliance.service.js';

async function startComplianceServer(): Promise<{ server: Server; baseUrl: string }> {
  process.env.DEV_AUTH_ENABLED = 'true';

  const { default: complianceRouter } = await import('./compliance.js');
  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  const server = app.listen(0);
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine test server port');
  }

  return {
    server,
    baseUrl: `http://localhost:${address.port}`,
  };
}

function stubReviewUpdate(handler: (payload: ReviewRequestUpdatePayload) => void): () => void {
  const original = complianceService.updateReviewRequest;

  complianceService.updateReviewRequest = async (_id: string, payload: ReviewRequestUpdatePayload) => {
    handler(payload);
    return {
      id: _id,
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: payload.status === 'PENDING' ? null : new Date(),
      document: {
        id: 'doc-1',
        title: 'Test Document',
      },
      requester: {
        id: 'requester-1',
        name: 'Requester',
        email: 'requester@example.com',
      },
      reviewer: {
        id: 'reviewer-1',
        name: 'Reviewer',
        email: 'reviewer@example.com',
      },
    } as any;
  };

  return () => {
    complianceService.updateReviewRequest = original;
  };
}

test('PATCH /reviews/:id keeps comments unchanged when omitted', async () => {
  let capturedPayload: ReviewRequestUpdatePayload | undefined;
  const restore = stubReviewUpdate((payload) => {
    capturedPayload = payload;
  });

  const { server, baseUrl } = await startComplianceServer();

  try {
    const response = await fetch(`${baseUrl}/api/compliance/reviews/review-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'APPROVED',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, undefined);
  } finally {
    restore();
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
});

test('PATCH /reviews/:id clears comments when null is explicit', async () => {
  let capturedPayload: ReviewRequestUpdatePayload | undefined;
  const restore = stubReviewUpdate((payload) => {
    capturedPayload = payload;
  });

  const { server, baseUrl } = await startComplianceServer();

  try {
    const response = await fetch(`${baseUrl}/api/compliance/reviews/review-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'APPROVED',
        comments: null,
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, null);
  } finally {
    restore();
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
});
