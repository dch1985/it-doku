import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeReviewUpdateBody } from './compliance.utils.js';

test('normalizes status to uppercase', () => {
  assert.deepEqual(normalizeReviewUpdateBody({ status: 'approved' }), {
    status: 'APPROVED',
    comments: undefined,
  });
});

test('preserves omitted comments as undefined', () => {
  assert.deepEqual(normalizeReviewUpdateBody({ status: 'pending' }), {
    status: 'PENDING',
    comments: undefined,
  });
});

test('keeps explicit comments value', () => {
  assert.deepEqual(
    normalizeReviewUpdateBody({ status: 'changes_requested', comments: 'Need evidence logs' }),
    {
      status: 'CHANGES_REQUESTED',
      comments: 'Need evidence logs',
    },
  );
});

test('allows explicit comment removal with null', () => {
  assert.deepEqual(normalizeReviewUpdateBody({ status: 'approved', comments: null }), {
    status: 'APPROVED',
    comments: null,
  });
});
