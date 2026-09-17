import assert from 'node:assert/strict';
import test from 'node:test';
import { pickOptionalNullableString } from './compliance.js';

test('pickOptionalNullableString keeps omitted fields undefined', () => {
  const body = { status: 'APPROVED' };
  const value = pickOptionalNullableString(body, 'comments');
  assert.equal(value, undefined);
});

test('pickOptionalNullableString keeps string values', () => {
  const body = { comments: 'Looks good' };
  const value = pickOptionalNullableString(body, 'comments');
  assert.equal(value, 'Looks good');
});

test('pickOptionalNullableString keeps explicit null values', () => {
  const body = { comments: null };
  const value = pickOptionalNullableString(body, 'comments');
  assert.equal(value, null);
});

test('pickOptionalNullableString coerces non-string values to null', () => {
  const body = { comments: 123 as unknown as string };
  const value = pickOptionalNullableString(body, 'comments');
  assert.equal(value, null);
});
