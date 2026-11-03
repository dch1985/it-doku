import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReviewUpdatePayload } from './compliance.js';

const baseContext = {
  tenantId: 'tenant-1',
  actorId: 'actor-1',
  actorRole: 'USER',
  actorTenantRole: 'MEMBER',
};

test('buildReviewUpdatePayload preserves existing comments when comments are omitted', () => {
  const payload = buildReviewUpdatePayload({ status: 'approved' }, baseContext);

  assert.equal(payload.status, 'APPROVED');
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'comments'), false);
});

test('buildReviewUpdatePayload forwards comments when explicitly provided', () => {
  const payload = buildReviewUpdatePayload(
    { status: 'changes_requested', comments: 'Bitte ergänzen' },
    baseContext,
  );

  assert.equal(payload.status, 'CHANGES_REQUESTED');
  assert.equal(payload.comments, 'Bitte ergänzen');
});

test('buildReviewUpdatePayload forwards explicit null comments', () => {
  const payload = buildReviewUpdatePayload(
    { status: 'pending', comments: null },
    baseContext,
  );

  assert.equal(payload.status, 'PENDING');
  assert.equal(payload.comments, null);
});

test('buildReviewUpdatePayload rejects non-string comments payloads', () => {
  assert.throws(() => {
    buildReviewUpdatePayload(
      {
        comments: 123 as unknown as string,
      },
      baseContext,
    );
  }, /comments muss ein String oder null sein/);
});
