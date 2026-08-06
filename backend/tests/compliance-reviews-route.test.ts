import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';

test('PATCH /compliance/reviews keeps comments unless explicitly provided', async () => {
  process.env.NODE_ENV = 'development';
  process.env.DEV_AUTH_ENABLED = 'true';

  const [{ complianceService }, { default: complianceRouter }] = await Promise.all([
    import('../src/services/compliance.service.js'),
    import('../src/routes/compliance.js'),
  ]);

  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  const capturedPayloads: Array<{ status?: string; comments?: string | null; tenantId?: string | null }> = [];

  (complianceService as any).updateReviewRequest = async (
    id: string,
    payload: { status?: string; comments?: string | null; tenantId?: string | null },
  ) => {
    capturedPayloads.push(payload);
    return {
      id,
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? 'existing-comment',
    };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://localhost:${port}/api/compliance/reviews/review-1`;

  try {
    const statusOnlyResponse = await fetch(baseUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert.equal(statusOnlyResponse.status, 200);

    const explicitNullResponse = await fetch(baseUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', comments: null }),
    });
    assert.equal(explicitNullResponse.status, 200);

    assert.equal(capturedPayloads.length, 2);
    assert.equal(capturedPayloads[0]?.status, 'APPROVED');
    assert.equal(capturedPayloads[0]?.comments, undefined);
    assert.equal(capturedPayloads[1]?.status, 'REJECTED');
    assert.equal(capturedPayloads[1]?.comments, null);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
