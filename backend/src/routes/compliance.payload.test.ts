import test from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationError } from '../middleware/errorHandler.js';
import { parseUpdateFindingBody, parseUpdateReviewBody } from './compliance.payload.js';

test('parseUpdateReviewBody keeps existing comments when omitted in PATCH body', () => {
  const parsed = parseUpdateReviewBody({ status: 'approved' });

  assert.equal(parsed.status, 'APPROVED');
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'comments'), false);
});

test('parseUpdateReviewBody keeps explicit null comments as a clear operation', () => {
  const parsed = parseUpdateReviewBody({ comments: null });

  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'comments'), true);
  assert.equal(parsed.comments, null);
});

test('parseUpdateFindingBody does not force resolution when missing', () => {
  const parsed = parseUpdateFindingBody({ action: 'resolve' });

  assert.equal(parsed.action, 'RESOLVE');
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'resolution'), false);
});

test('parseUpdateFindingBody rejects unsupported actions', () => {
  assert.throws(
    () => parseUpdateFindingBody({ action: 'invalidate' }),
    (error) =>
      error instanceof ApplicationError &&
      error.statusCode === 400 &&
      error.message.includes('Ungültige Aktion'),
  );
});
