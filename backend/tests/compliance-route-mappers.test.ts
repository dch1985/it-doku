import assert from 'node:assert/strict';
import test from 'node:test';

import { mapFindingUpdateBody, mapReviewUpdateBody } from '../src/routes/compliance.js';

test('mapReviewUpdateBody keeps comments untouched when omitted', () => {
  const mapped = mapReviewUpdateBody({ status: 'approved' });

  assert.equal(mapped.status, 'APPROVED');
  assert.equal(mapped.comments, undefined);
});

test('mapReviewUpdateBody allows explicit comment clearing', () => {
  const mapped = mapReviewUpdateBody({ comments: null });

  assert.equal(mapped.status, undefined);
  assert.equal(mapped.comments, null);
});

test('mapFindingUpdateBody keeps resolution untouched when omitted', () => {
  const mapped = mapFindingUpdateBody({ action: 'resolve' });

  assert.equal(mapped.action, 'RESOLVE');
  assert.equal(mapped.resolution, undefined);
});

test('mapFindingUpdateBody keeps explicit null resolution', () => {
  const mapped = mapFindingUpdateBody({ resolution: null });

  assert.equal(mapped.action, undefined);
  assert.equal(mapped.resolution, null);
});
