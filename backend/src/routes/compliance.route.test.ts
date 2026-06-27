import test from 'node:test';
import assert from 'node:assert/strict';
import { mapReviewUpdateBody } from './compliance.js';

test('mapReviewUpdateBody keeps comments untouched when omitted', () => {
  const payload = mapReviewUpdateBody({ status: 'approved' }, 'tenant-1');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.tenantId, 'tenant-1');
  assert.equal(payload.comments, undefined);
});

test('mapReviewUpdateBody allows explicit comment clearing', () => {
  const payload = mapReviewUpdateBody({ status: 'APPROVED', comments: null }, 'tenant-1');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, null);
});

test('mapReviewUpdateBody keeps explicit comment updates', () => {
  const payload = mapReviewUpdateBody({ status: 'CHANGES_REQUESTED', comments: 'Please add references.' }, 'tenant-1');

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Please add references.');
});
