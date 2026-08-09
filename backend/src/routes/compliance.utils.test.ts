import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewUpdateBody } from './compliance.utils.js';

test('normalizes status and keeps comments undefined when omitted', () => {
  const payload = normalizeReviewUpdateBody({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('preserves provided comments', () => {
  const payload = normalizeReviewUpdateBody({
    status: 'changes_requested',
    comments: 'Need a rollback plan',
  });

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Need a rollback plan');
});

test('allows explicit comment removal', () => {
  const payload = normalizeReviewUpdateBody({
    status: 'rejected',
    comments: null,
  });

  assert.equal(payload.status, 'REJECTED');
  assert.equal(payload.comments, null);
});
