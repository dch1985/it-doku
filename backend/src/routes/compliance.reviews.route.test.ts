import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';

type PatchReviewResult = {
  status: number;
  payload: Record<string, unknown> | undefined;
};

async function patchReview(body: Record<string, unknown>): Promise<PatchReviewResult> {
  process.env.DEV_AUTH_ENABLED = 'true';

  const [{ default: complianceRouter }, { complianceService }] = await Promise.all([
    import('./compliance.js'),
    import('../services/compliance.service.js'),
  ]);

  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | undefined;

  complianceService.updateReviewRequest = async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: _id, ...payload } as any;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test server address unavailable');
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/compliance/reviews/review-123`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      payload: capturedPayload,
    };
  } finally {
    complianceService.updateReviewRequest = originalUpdateReviewRequest;
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

test('PATCH /reviews/:id keeps existing comment when comments is omitted', async () => {
  const result = await patchReview({ status: 'APPROVED' });

  assert.equal(result.status, 200);
  assert.equal(result.payload?.status, 'APPROVED');
  assert.equal(result.payload?.comments, undefined);
});

test('PATCH /reviews/:id clears comment when comments is explicitly null', async () => {
  const result = await patchReview({ status: 'APPROVED', comments: null });

  assert.equal(result.status, 200);
  assert.equal(result.payload?.comments, null);
});
