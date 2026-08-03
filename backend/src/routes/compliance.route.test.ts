import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import {
  buildQualityFindingUpdatePayload,
  buildReviewRequestUpdatePayload,
} from './compliance.js';

test('buildReviewRequestUpdatePayload keeps comments unchanged when omitted', () => {
  const payload = buildReviewRequestUpdatePayload({ status: 'approved' }, 'tenant-1');

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
  assert.equal(payload.tenantId, 'tenant-1');
});

test('buildReviewRequestUpdatePayload allows explicit comment clearing', () => {
  const payload = buildReviewRequestUpdatePayload({ comments: null }, 'tenant-1');

  assert.equal(payload.status, undefined);
  assert.equal(payload.comments, null);
  assert.equal(payload.tenantId, 'tenant-1');
});

test('buildReviewRequestUpdatePayload rejects invalid comment types', () => {
  assert.throws(
    () => buildReviewRequestUpdatePayload({ comments: 123 as any }, 'tenant-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 400 &&
      error.message.includes('comments'),
  );
});

test('buildQualityFindingUpdatePayload keeps resolution unchanged when omitted', () => {
  const payload = buildQualityFindingUpdatePayload({ action: 'RESOLVE' });

  assert.equal(payload.action, 'RESOLVE');
  assert.equal(payload.resolution, undefined);
});

test('buildQualityFindingUpdatePayload rejects invalid action values', () => {
  assert.throws(
    () => buildQualityFindingUpdatePayload({ action: 'INVALID' as any }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 400 &&
      error.message.includes('Ungültige Aktion'),
  );
});
