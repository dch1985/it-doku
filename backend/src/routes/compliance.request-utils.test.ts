import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOptionalComment } from './compliance.request-utils.js';

test('normalizeOptionalComment returns undefined when comments is omitted', () => {
  assert.equal(normalizeOptionalComment({}), undefined);
  assert.equal(normalizeOptionalComment({ status: 'APPROVED' } as any), undefined);
});

test('normalizeOptionalComment preserves explicit null and string values', () => {
  assert.equal(normalizeOptionalComment({ comments: null }), null);
  assert.equal(normalizeOptionalComment({ comments: 'Looks good' }), 'Looks good');
});
