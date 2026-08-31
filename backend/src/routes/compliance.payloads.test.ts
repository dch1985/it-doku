import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQualityFindingChanges, buildReviewRequestChanges } from './compliance.payloads.js';

test('buildReviewRequestChanges preserves omitted comments', () => {
  const payload = buildReviewRequestChanges({
    status: 'approved',
  });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('buildReviewRequestChanges keeps explicit nullable comments', () => {
  const nullPayload = buildReviewRequestChanges({
    comments: null,
  });
  const textPayload = buildReviewRequestChanges({
    comments: 'Ready for release',
  });

  assert.equal(nullPayload.comments, null);
  assert.equal(textPayload.comments, 'Ready for release');
});

test('buildQualityFindingChanges preserves omitted resolution', () => {
  const payload = buildQualityFindingChanges({
    action: 'resolve',
  });

  assert.equal(payload.action, 'RESOLVE');
  assert.equal(payload.resolution, undefined);
});

test('buildQualityFindingChanges keeps explicit nullable resolution', () => {
  const nullPayload = buildQualityFindingChanges({
    resolution: null,
  });
  const textPayload = buildQualityFindingChanges({
    resolution: 'False positive',
  });

  assert.equal(nullPayload.resolution, null);
  assert.equal(textPayload.resolution, 'False positive');
});
