import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError } from '../middleware/errorHandler.js';
import { buildFindingUpdatePayload, buildReviewUpdatePayload } from './compliance.payloads.js';

test('compliance payload builders preserve optional PATCH semantics', async (t) => {
  await t.test('review status-only payload keeps comments omitted', () => {
    const payload = buildReviewUpdatePayload({ status: 'approved' });
    assert.deepEqual(payload, { status: 'APPROVED' });
    assert.equal('comments' in payload, false);
  });

  await t.test('review payload accepts explicit null comments', () => {
    const payload = buildReviewUpdatePayload({ comments: null });
    assert.deepEqual(payload, { comments: null });
    assert.equal('comments' in payload, true);
  });

  await t.test('review payload rejects non-string comments', () => {
    assert.throws(
      () => buildReviewUpdatePayload({ comments: 123 as unknown as string }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 400 &&
        error.message.includes('comments muss string oder null sein'),
    );
  });

  await t.test('finding payload normalizes action casing', () => {
    const payload = buildFindingUpdatePayload({ action: 'resolve' });
    assert.deepEqual(payload, { action: 'RESOLVE' });
    assert.equal('resolution' in payload, false);
  });

  await t.test('finding payload keeps resolution omitted unless provided', () => {
    const payload = buildFindingUpdatePayload({});
    assert.deepEqual(payload, {});
    assert.equal('resolution' in payload, false);
  });

  await t.test('finding payload rejects invalid action values', () => {
    assert.throws(
      () => buildFindingUpdatePayload({ action: 'invalid' }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 400 &&
        error.message.includes('Ungültige Aktion'),
    );
  });

  await t.test('finding payload accepts explicit null resolution', () => {
    const payload = buildFindingUpdatePayload({ resolution: null });
    assert.deepEqual(payload, { resolution: null });
    assert.equal('resolution' in payload, true);
  });

  await t.test('finding payload rejects non-string resolution values', () => {
    assert.throws(
      () => buildFindingUpdatePayload({ resolution: 7 as unknown as string }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 400 &&
        error.message.includes('resolution muss string oder null sein'),
    );
  });
});
