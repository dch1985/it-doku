import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReviewUpdatePayload } from './compliance.utils.js';

test('buildReviewUpdatePayload keeps comments undefined when omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('buildReviewUpdatePayload keeps explicit null comments', () => {
  const payload = buildReviewUpdatePayload({
    status: 'changes_requested',
    comments: null,
  });

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, null);
});

test('buildReviewUpdatePayload keeps explicit comment value', () => {
  const payload = buildReviewUpdatePayload({
    comments: 'Bitte Abschnitt 2 ergänzen',
  });

  assert.equal(payload.status, undefined);
  assert.equal(payload.comments, 'Bitte Abschnitt 2 ergänzen');
});
