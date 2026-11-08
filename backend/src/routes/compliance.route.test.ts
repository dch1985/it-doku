import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReviewUpdatePayload } from './compliance.js';

test('buildReviewUpdatePayload keeps existing comments when comments field is omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' }, 'tenant-1');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.tenantId, 'tenant-1');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), false);
});

test('buildReviewUpdatePayload allows explicit clearing of comments', () => {
  const payload = buildReviewUpdatePayload({ comments: null }, 'tenant-1');

  assert.equal(payload.tenantId, 'tenant-1');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), true);
  assert.equal(payload.comments, null);
});

test('buildReviewUpdatePayload forwards non-empty comments', () => {
  const payload = buildReviewUpdatePayload({ status: 'changes_requested', comments: 'Bitte fehlende Nachweise ergänzen' }, 'tenant-1');

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Bitte fehlende Nachweise ergänzen');
});
