import assert from 'node:assert/strict';
import test from 'node:test';
import { isTenantResourceAccessible } from './automation.js';

test('isTenantResourceAccessible returns true for matching tenant ids', () => {
  assert.equal(isTenantResourceAccessible('tenant-a', 'tenant-a'), true);
});

test('isTenantResourceAccessible returns false for mismatched tenant ids', () => {
  assert.equal(isTenantResourceAccessible('tenant-a', 'tenant-b'), false);
});

test('isTenantResourceAccessible returns false when tenant context is missing', () => {
  assert.equal(isTenantResourceAccessible('tenant-a', undefined), false);
  assert.equal(isTenantResourceAccessible(undefined, 'tenant-a'), false);
});
