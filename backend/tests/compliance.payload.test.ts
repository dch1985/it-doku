import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeQualityFindingBody, normalizeReviewUpdateBody } from '../src/routes/compliance.payload.js';

test('normalizeReviewUpdateBody keeps comments undefined when omitted', () => {
  const payload = normalizeReviewUpdateBody({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('normalizeReviewUpdateBody keeps explicit null comments', () => {
  const payload = normalizeReviewUpdateBody({ status: 'approved', comments: null });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, null);
});

test('normalizeQualityFindingBody keeps resolution undefined when omitted', () => {
  const payload = normalizeQualityFindingBody({ action: 'RESOLVE' });

  assert.equal(payload.action, 'RESOLVE');
  assert.equal(payload.resolution, undefined);
});

test('normalizeQualityFindingBody keeps explicit null resolution', () => {
  const payload = normalizeQualityFindingBody({ action: 'REOPEN', resolution: null });

  assert.equal(payload.action, 'REOPEN');
  assert.equal(payload.resolution, null);
});
