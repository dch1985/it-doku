import assert from 'node:assert/strict';
import { readOptionalNullableText } from './compliance.utils.js';

assert.equal(readOptionalNullableText(undefined, 'comments'), undefined);
assert.equal(readOptionalNullableText({}, 'comments'), undefined);
assert.equal(readOptionalNullableText({ comments: 'Looks good' }, 'comments'), 'Looks good');
assert.equal(readOptionalNullableText({ comments: null }, 'comments'), null);
assert.equal(readOptionalNullableText({ comments: undefined }, 'comments'), undefined);
assert.equal(readOptionalNullableText({ comments: 123 }, 'comments'), null);

assert.equal(readOptionalNullableText(undefined, 'resolution'), undefined);
assert.equal(readOptionalNullableText({}, 'resolution'), undefined);
assert.equal(readOptionalNullableText({ resolution: 'Fixed in runbook' }, 'resolution'), 'Fixed in runbook');
assert.equal(readOptionalNullableText({ resolution: null }, 'resolution'), null);

console.log('compliance.utils.test.ts passed');
