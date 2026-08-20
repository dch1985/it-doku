import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractFindingResolution, extractReviewComments } from './compliance.js';

test('extractReviewComments keeps omitted comments as undefined', () => {
  const result = extractReviewComments({ status: 'APPROVED' });
  assert.equal(result, undefined);
});

test('extractReviewComments treats explicit comments null/undefined as clear intent', () => {
  assert.equal(extractReviewComments({ comments: null }), null);
  assert.equal(extractReviewComments({ comments: undefined }), null);
});

test('extractReviewComments preserves explicit text values', () => {
  const result = extractReviewComments({ comments: 'Needs changes' });
  assert.equal(result, 'Needs changes');
});

test('extractFindingResolution keeps omitted resolution as undefined', () => {
  const result = extractFindingResolution({ action: 'RESOLVE' });
  assert.equal(result, undefined);
});

test('extractFindingResolution preserves explicit null and string values', () => {
  assert.equal(extractFindingResolution({ resolution: null }), null);
  assert.equal(extractFindingResolution({ resolution: 'Documented mitigation' }), 'Documented mitigation');
});
