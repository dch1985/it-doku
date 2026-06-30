import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeReviewUpdatePayload } from './compliance.utils.js';

test('normalizeReviewUpdatePayload keeps comments undefined when omitted', () => {
  const result = normalizeReviewUpdatePayload({ status: 'approved' });

  assert.equal(result.status, 'APPROVED');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'comments'), false);
});

test('normalizeReviewUpdatePayload preserves explicit null comment', () => {
  const result = normalizeReviewUpdatePayload({ comments: null });

  assert.equal(Object.prototype.hasOwnProperty.call(result, 'comments'), true);
  assert.equal(result.comments, null);
});

test('normalizeReviewUpdatePayload keeps explicit comment text', () => {
  const result = normalizeReviewUpdatePayload({ comments: 'Looks good', status: 'pending' });

  assert.equal(result.status, 'PENDING');
  assert.equal(result.comments, 'Looks good');
});
