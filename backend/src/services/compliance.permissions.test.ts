import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReviewUpdatePermission } from './compliance.service.js';

test('assertReviewUpdatePermission allows assigned reviewer', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('reviewer-1', 'USER', 'reviewer-1');
  });
});

test('assertReviewUpdatePermission allows admin users', () => {
  assert.doesNotThrow(() => {
    assertReviewUpdatePermission('admin-1', 'ADMIN', 'reviewer-1');
  });
});

test('assertReviewUpdatePermission rejects unauthenticated actor', () => {
  assert.throws(() => {
    assertReviewUpdatePermission(null, 'USER', 'reviewer-1');
  }, /Authentifizierung erforderlich/);
});

test('assertReviewUpdatePermission rejects non-reviewer non-admin actor', () => {
  assert.throws(() => {
    assertReviewUpdatePermission('user-2', 'USER', 'reviewer-1');
  }, /Nur zugewiesene Reviewer dürfen dieses Review aktualisieren/);
});
