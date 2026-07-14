import test from 'node:test';
import assert from 'node:assert/strict';

import { ApplicationError } from '../middleware/errorHandler.js';
import { buildFindingUpdatePayload, buildReviewUpdatePayload } from './compliance.js';

test('buildReviewUpdatePayload keeps comments undefined when omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' });

  assert.equal(payload.status, 'APPROVED');
  assert.equal(payload.comments, undefined);
});

test('buildReviewUpdatePayload keeps explicit null comment', () => {
  const payload = buildReviewUpdatePayload({ comments: null });

  assert.equal(payload.status, undefined);
  assert.equal(payload.comments, null);
});

test('buildFindingUpdatePayload keeps resolution undefined when omitted', () => {
  const payload = buildFindingUpdatePayload({ action: 'RESOLVE' });

  assert.equal(payload.action, 'RESOLVE');
  assert.equal(payload.resolution, undefined);
});

test('buildFindingUpdatePayload accepts explicit null resolution', () => {
  const payload = buildFindingUpdatePayload({ resolution: null });

  assert.equal(payload.action, undefined);
  assert.equal(payload.resolution, null);
});

test('buildFindingUpdatePayload rejects invalid actions', () => {
  assert.throws(
    () => buildFindingUpdatePayload({ action: 'INVALID' as 'RESOLVE' | 'REOPEN' }),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 400 &&
      error.message.includes('Ungültige Aktion'),
  );
});
