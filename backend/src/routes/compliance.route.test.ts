import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { complianceService } from '../services/compliance.service.js';

test('patch review keeps comments unchanged when field is omitted', { concurrency: false }, async () => {
  process.env.NODE_ENV = 'development';

  const complianceRoute = await import('./compliance.js');
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: any;

  (complianceService as any).updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return {
      id: _id,
      status: payload.status ?? 'PENDING',
      comments: 'existing comment',
    };
  };

  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRoute.default);

  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://localhost:${address.port}/api/compliance/reviews/review-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'APPROVED',
      }),
    });

    assert.equal(response.status, 200);
    assert.ok(capturedPayload);
    assert.equal(capturedPayload.comments, undefined);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
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
