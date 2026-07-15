import test from 'node:test';
import assert from 'node:assert/strict';

import { extractReviewCommentsFromBody } from '../src/routes/compliance.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';

test('extractReviewCommentsFromBody returns undefined when comments are omitted', () => {
  const comments = extractReviewCommentsFromBody({ status: 'APPROVED' });
  assert.equal(comments, undefined);
});

test('extractReviewCommentsFromBody keeps explicit null to clear comments', () => {
  const comments = extractReviewCommentsFromBody({ comments: null });
  assert.equal(comments, null);
});

test('extractReviewCommentsFromBody keeps provided string comments', () => {
  const comments = extractReviewCommentsFromBody({ comments: 'Reviewed and approved' });
  assert.equal(comments, 'Reviewed and approved');
});

test('extractReviewCommentsFromBody rejects non-string comment payloads', () => {
  assert.throws(
    () => extractReviewCommentsFromBody({ comments: 42 as any }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 400);
      return true;
    },
  );
});
