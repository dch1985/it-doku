import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '../middleware/errorHandler.js';
import { assertReviewUpdatePermission } from './compliance.service.js';

test('assertReviewUpdatePermission allows assigned reviewer', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('reviewer-1', 'USER', 'MEMBER', 'reviewer-1');
  });
});

test('assertReviewUpdatePermission allows platform admin', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('actor-1', 'ADMIN', 'MEMBER', 'reviewer-1');
  });
});

test('assertReviewUpdatePermission allows tenant owner/admin', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('actor-1', 'USER', 'OWNER', 'reviewer-1');
  });
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('actor-1', 'USER', 'ADMIN', 'reviewer-1');
  });
});

test('assertReviewUpdatePermission rejects missing actor', () => {
  assert.throws(
    () => assertReviewUpdatePermission(null, 'USER', 'MEMBER', 'reviewer-1'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

test('assertReviewUpdatePermission rejects unrelated non-admin users', () => {
  assert.throws(
    () => assertReviewUpdatePermission('actor-2', 'USER', 'MEMBER', 'reviewer-1'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});
