import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewUpdatePayload } from './compliance.js';

test('buildReviewUpdatePayload preserves undefined comments when omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('buildReviewUpdatePayload keeps explicit null comments for intentional clearing', () => {
  const payload = buildReviewUpdatePayload({ comments: null });

  assert.equal(payload.status, undefined);
  assert.equal(payload.comments, null);
});
