import test from 'node:test';
import assert from 'node:assert/strict';

import { mapReviewUpdateBody } from '../src/routes/compliance.route-mappers.js';

test('mapReviewUpdateBody keeps existing comments when comments field is omitted', () => {
  const payload = mapReviewUpdateBody({ status: 'approved' }, 'tenant-123');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.tenantId, 'tenant-123');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), false);
});

test('mapReviewUpdateBody keeps explicit comment updates', () => {
  const payload = mapReviewUpdateBody(
    {
      status: 'changes_requested',
      comments: 'Bitte Abschnitt 2 ergänzen',
    },
    'tenant-456',
  );

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Bitte Abschnitt 2 ergänzen');
  assert.equal(payload.tenantId, 'tenant-456');
});

test('mapReviewUpdateBody supports explicit comment clears via null', () => {
  const payload = mapReviewUpdateBody(
    {
      comments: null,
    },
    'tenant-789',
  );

  assert.equal(payload.comments, null);
  assert.equal(payload.tenantId, 'tenant-789');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'status'), false);
});
