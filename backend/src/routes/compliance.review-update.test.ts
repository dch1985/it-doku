import assert from 'node:assert/strict';
import express from 'express';

process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

const { default: complianceRouter } = await import('./compliance.js');
const { complianceService } = await import('../services/compliance.service.js');

type CapturedPayload = {
  status?: string;
  comments?: string | null;
  tenantId?: string | null;
};

const capturedPayloads: CapturedPayload[] = [];
const originalUpdateReviewRequest = complianceService.updateReviewRequest;

complianceService.updateReviewRequest = async (_id: string, payload: any) => {
  capturedPayloads.push(payload);
  return { id: _id, ...payload } as any;
};

const app = express();
app.use(express.json());
app.use('/compliance', complianceRouter);

const server = app.listen(0);
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Could not resolve test server address');
}

const baseUrl = `http://localhost:${address.port}`;
const commonHeaders = {
  'content-type': 'application/json',
};

try {
  const statusOnlyResponse = await fetch(`${baseUrl}/compliance/reviews/review-1`, {
    method: 'PATCH',
    headers: commonHeaders,
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  assert.equal(statusOnlyResponse.status, 200, 'status-only PATCH request should succeed');
  assert.equal(capturedPayloads[0]?.status, 'APPROVED');
  assert.equal(
    capturedPayloads[0]?.comments,
    undefined,
    'status-only updates must not overwrite existing comments',
  );

  const explicitNullResponse = await fetch(`${baseUrl}/compliance/reviews/review-1`, {
    method: 'PATCH',
    headers: commonHeaders,
    body: JSON.stringify({ comments: null }),
  });
  assert.equal(explicitNullResponse.status, 200, 'explicit null PATCH request should succeed');
  assert.equal(capturedPayloads[1]?.comments, null, 'explicit null should clear the stored comment');

  const explicitCommentResponse = await fetch(`${baseUrl}/compliance/reviews/review-1`, {
    method: 'PATCH',
    headers: commonHeaders,
    body: JSON.stringify({ comments: 'Looks good' }),
  });
  assert.equal(explicitCommentResponse.status, 200, 'explicit comment PATCH request should succeed');
  assert.equal(capturedPayloads[2]?.comments, 'Looks good', 'explicit comment should be forwarded');
} finally {
  complianceService.updateReviewRequest = originalUpdateReviewRequest;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

console.log('compliance review update route tests passed');
