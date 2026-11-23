import assert from 'node:assert/strict';
import test from 'node:test';

import { ApplicationError } from '../middleware/errorHandler.js';
import { getOptionalNullableStringField } from './compliance.js';

test('getOptionalNullableStringField keeps omitted fields unchanged', () => {
  const value = getOptionalNullableStringField({ status: 'APPROVED' }, 'comments');
  assert.equal(value, undefined);
});

test('getOptionalNullableStringField accepts explicit null values', () => {
  const value = getOptionalNullableStringField({ comments: null }, 'comments');
  assert.equal(value, null);
});

test('getOptionalNullableStringField returns explicit string values', () => {
  const value = getOptionalNullableStringField({ comments: 'Looks good' }, 'comments');
  assert.equal(value, 'Looks good');
});

test('getOptionalNullableStringField rejects non-string values', () => {
  assert.throws(
    () => getOptionalNullableStringField({ comments: 42 }, 'comments'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 400);
      return true;
    },
  );
});
