import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../src/middleware/errorHandler.ts';
import { assertReviewUpdatePermission } from '../src/services/compliance.service.ts';

test('allows the assigned reviewer to update a review request', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('reviewer-1', 'reviewer-1');
  });
});

test('rejects updates when actor is unauthenticated', () => {
  assert.throws(
    () => assertReviewUpdatePermission(null, 'reviewer-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('Authentifizierung'),
  );
});

test('rejects updates from users other than assigned reviewer', () => {
  assert.throws(
    () => assertReviewUpdatePermission('different-user', 'reviewer-1'),
    (error: unknown) =>
      error instanceof ApplicationError &&
      error.statusCode === 403 &&
      error.message.includes('zugewiesene Reviewer'),
  );
});
