import assert from 'node:assert/strict';
import test from 'node:test';

import { getOptionalNullableStringField } from './compliance.utils.js';

test('returns undefined when optional field is omitted', () => {
  const body = { status: 'APPROVED' };

  assert.equal(getOptionalNullableStringField(body, 'comments'), undefined);
});

test('returns null when optional field is explicitly null', () => {
  const body = { comments: null };

  assert.equal(getOptionalNullableStringField(body, 'comments'), null);
});

test('returns original string when field is provided', () => {
  const body = { comments: 'Bitte Abschnitt 3 pruefen' };

  assert.equal(
    getOptionalNullableStringField(body, 'comments'),
    'Bitte Abschnitt 3 pruefen',
  );
});
