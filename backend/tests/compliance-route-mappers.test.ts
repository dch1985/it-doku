import assert from 'node:assert/strict';
import test from 'node:test';
import { mapReviewUpdateBody } from '../src/routes/compliance.route-mappers.js';

test('mapReviewUpdateBody keeps comments untouched when field is omitted', () => {
  const mapped = mapReviewUpdateBody({ status: 'approved' });

  assert.equal(mapped.status, 'APPROVED');
  assert.equal(Object.prototype.hasOwnProperty.call(mapped, 'comments'), false);
});

test('mapReviewUpdateBody keeps explicit null to clear existing comments', () => {
  const mapped = mapReviewUpdateBody({ status: 'rejected', comments: null });

  assert.equal(mapped.status, 'REJECTED');
  assert.equal(mapped.comments, null);
});

test('mapReviewUpdateBody forwards explicit comments', () => {
  const mapped = mapReviewUpdateBody({ comments: 'Bitte Nachweise ergänzen' });

  assert.equal(mapped.status, undefined);
  assert.equal(mapped.comments, 'Bitte Nachweise ergänzen');
});
