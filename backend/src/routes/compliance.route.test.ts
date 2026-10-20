import assert from 'node:assert/strict';
import test from 'node:test';
import { mapReviewUpdateBody } from './compliance.js';

test('mapReviewUpdateBody preserves comments when field is omitted', () => {
  const payload = mapReviewUpdateBody({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('mapReviewUpdateBody allows explicit comment updates', () => {
  const payload = mapReviewUpdateBody({ status: 'changes_requested', comments: 'Bitte ergänzen.' });

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Bitte ergänzen.');
});

test('mapReviewUpdateBody allows explicit comment clearing', () => {
  const payload = mapReviewUpdateBody({ comments: null });

  assert.equal(payload.status, undefined);
  assert.equal(payload.comments, null);
});
