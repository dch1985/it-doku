import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewRequestUpdatePayload } from '../compliance.js';

test('keeps existing comments when only status is provided', () => {
  const payload = buildReviewRequestUpdatePayload({ status: 'approved' }, 'tenant-a');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.tenantId, 'tenant-a');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), false);
});

test('allows explicitly clearing comments', () => {
  const payload = buildReviewRequestUpdatePayload({ comments: null }, 'tenant-a');

  assert.equal(payload.comments, null);
  assert.equal(payload.tenantId, 'tenant-a');
});

test('keeps explicit comment updates', () => {
  const payload = buildReviewRequestUpdatePayload(
    { status: 'changes_requested', comments: 'Bitte Section 2 ergänzen.' },
    'tenant-a',
  );

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Bitte Section 2 ergänzen.');
});
