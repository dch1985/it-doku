import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import { getOptionalNullableStringField } from './compliance.js';

test('returns undefined when nullable string field is omitted', () => {
  const result = getOptionalNullableStringField({ status: 'APPROVED' }, 'comments');
  assert.equal(result, undefined);
});

test('returns null when nullable string field is explicitly null', () => {
  const result = getOptionalNullableStringField({ comments: null }, 'comments');
  assert.equal(result, null);
});

test('returns string when nullable string field is explicitly set', () => {
  const result = getOptionalNullableStringField({ comments: 'Looks good' }, 'comments');
  assert.equal(result, 'Looks good');
});

test('throws ApplicationError for invalid nullable string field type', () => {
  assert.throws(
    () => getOptionalNullableStringField({ comments: 123 }, 'comments'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 400);
      return true;
    },
  );
});
