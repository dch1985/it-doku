import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

const [{ default: complianceRouter }, { complianceService }] = await Promise.all([
  import('./compliance.js'),
  import('../services/compliance.service.js'),
]);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', complianceRouter);
  return app;
}

async function sendRequest(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  body?: Record<string, unknown>,
) {
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = response.headers
      .get('content-type')
      ?.includes('application/json')
      ? await response.json()
      : null;

    return { status: response.status, body: responseBody };
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

test('PATCH /reviews does not clear comments when omitted', async (t) => {
  const original = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | null = null;

  complianceService.updateReviewRequest = async (_id, payload) => {
    capturedPayload = payload as Record<string, unknown>;
    return {
      id: 'review-1',
      status: payload.status ?? 'PENDING',
      comments: 'Bestehender Kommentar',
    } as any;
  };

  t.after(() => {
    complianceService.updateReviewRequest = original;
  });

  const response = await sendRequest(createApp(), 'PATCH', '/reviews/review-1', {
    status: 'APPROVED',
  });

  assert.equal(response.status, 200);
  assert.equal(capturedPayload?.status, 'APPROVED');
  assert.equal(capturedPayload?.comments, undefined);
});

test('PATCH /quality/findings keeps resolution untouched when omitted', async (t) => {
  const original = complianceService.updateQualityFinding;
  let capturedPayload: Record<string, unknown> | null = null;

  complianceService.updateQualityFinding = async (_id, payload) => {
    capturedPayload = payload as Record<string, unknown>;
    return {
      id: 'finding-1',
      resolution: 'Resolved',
      resolvedAt: new Date().toISOString(),
    } as any;
  };

  t.after(() => {
    complianceService.updateQualityFinding = original;
  });

  const response = await sendRequest(createApp(), 'PATCH', '/quality/findings/finding-1', {});

  assert.equal(response.status, 200);
  assert.equal(capturedPayload?.action, undefined);
  assert.equal(capturedPayload?.resolution, undefined);
});
