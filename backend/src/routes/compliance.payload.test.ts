import assert from 'node:assert/strict';
import test from 'node:test';

import { parseReviewComments } from './compliance.payload.js';

test('parseReviewComments returns undefined when comments field is omitted', () => {
  const payload = { status: 'APPROVED' } as const;
  const comments = parseReviewComments(payload);
  assert.equal(comments, undefined);
});

test('parseReviewComments returns null when comments is explicitly null', () => {
  const comments = parseReviewComments({ comments: null });
  assert.equal(comments, null);
});

test('parseReviewComments returns string when comments is provided', () => {
  const comments = parseReviewComments({ comments: 'Looks good' });
  assert.equal(comments, 'Looks good');
});
