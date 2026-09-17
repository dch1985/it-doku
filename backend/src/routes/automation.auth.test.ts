import assert from 'node:assert/strict';
import test from 'node:test';
import { isTenantOwned } from './automation.js';

test('isTenantOwned returns true when tenant IDs match', () => {
  assert.equal(isTenantOwned('tenant-a', 'tenant-a'), true);
});

test('isTenantOwned returns false when tenant IDs differ', () => {
  assert.equal(isTenantOwned('tenant-a', 'tenant-b'), false);
});

test('isTenantOwned handles missing values consistently', () => {
  assert.equal(isTenantOwned(undefined, undefined), true);
  assert.equal(isTenantOwned('tenant-a', undefined), false);
});
