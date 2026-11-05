import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import {
  buildQualityFindingUpdatePayload,
  buildReviewUpdatePayload,
} from './compliance.update-payload.js';

test('buildReviewUpdatePayload keeps comments untouched when omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' });
  assert.deepEqual(payload, { status: 'APPROVED' });
});

test('buildReviewUpdatePayload clears comments only when explicitly provided', () => {
  const payload = buildReviewUpdatePayload({ comments: null });
  assert.deepEqual(payload, { comments: null });
});

test('buildQualityFindingUpdatePayload keeps resolution untouched when omitted', () => {
  const payload = buildQualityFindingUpdatePayload({ action: 'resolve' });
  assert.deepEqual(payload, { action: 'RESOLVE' });
});

test('buildQualityFindingUpdatePayload keeps explicit null resolution', () => {
  const payload = buildQualityFindingUpdatePayload({ resolution: null });
  assert.deepEqual(payload, { resolution: null });
});

test('buildQualityFindingUpdatePayload rejects unsupported actions', () => {
  assert.throws(
    () => buildQualityFindingUpdatePayload({ action: 'skip' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 400 &&
      error.message.includes('Ungültige Aktion'),
  );
});
