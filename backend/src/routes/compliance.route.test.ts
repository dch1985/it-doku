import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

const { default: complianceRouter } = await import('./compliance.js');
const { complianceService } = await import('../services/compliance.service.js');

async function withComplianceApp(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://localhost:${port}`);
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

test('PATCH /reviews/:id preserves existing comments when omitted from payload', async () => {
  const original = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id, payload) => {
    capturedPayload = payload;
    return {
      id: 'review-1',
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? 'existing-review-comment',
    } as any;
  };

  try {
    await withComplianceApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/compliance/reviews/review-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      assert.equal(response.status, 200);
    });

    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: undefined,
      tenantId: null,
    });
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /reviews/:id still allows explicitly clearing comments', async () => {
  const original = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id, payload) => {
    capturedPayload = payload;
    return {
      id: 'review-1',
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? null,
    } as any;
  };

  try {
    await withComplianceApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/compliance/reviews/review-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', comments: null }),
      });

      assert.equal(response.status, 200);
    });

    assert.deepEqual(capturedPayload, {
      status: 'APPROVED',
      comments: null,
      tenantId: null,
    });
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /quality/findings/:id does not clear resolution when omitted', async () => {
  const original = complianceService.updateQualityFinding;
  let capturedPayload: unknown;

  complianceService.updateQualityFinding = async (_id, payload) => {
    capturedPayload = payload;
    return {
      id: 'finding-1',
      action: payload.action ?? null,
      resolution: payload.resolution ?? null,
    } as any;
  };

  try {
    await withComplianceApp(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/compliance/quality/findings/finding-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE' }),
      });

      assert.equal(response.status, 200);
    });

    assert.deepEqual(capturedPayload, {
      action: 'RESOLVE',
      resolution: undefined,
    });
  } finally {
    complianceService.updateQualityFinding = original;
  }
});
