import test from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '../src/lib/prisma.js';
import { complianceService } from '../src/services/compliance.service.js';
import { assistantService } from '../src/services/assistant.service.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';

const prismaMock = prisma as any;

test('runQualityChecks rejects cross-tenant access before deleting findings', async (t) => {
  const originalFindDocument = prismaMock.document.findUnique;
  const originalDeleteFindings = prismaMock.qualityFinding.deleteMany;
  const originalCreateFindings = prismaMock.qualityFinding.createMany;

  let deleteCalled = false;
  let createCalled = false;

  prismaMock.document.findUnique = async () => ({
    id: 'doc-1',
    title: 'Sensitive Doc',
    content: 'owner: team-a',
    category: 'SECURITY',
    tenantId: 'tenant-a',
  });
  prismaMock.qualityFinding.deleteMany = async () => {
    deleteCalled = true;
    return { count: 1 };
  };
  prismaMock.qualityFinding.createMany = async () => {
    createCalled = true;
    return { count: 1 };
  };

  t.after(() => {
    prismaMock.document.findUnique = originalFindDocument;
    prismaMock.qualityFinding.deleteMany = originalDeleteFindings;
    prismaMock.qualityFinding.createMany = originalCreateFindings;
  });

  await assert.rejects(
    () => complianceService.runQualityChecks('doc-1', 'tenant-b'),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );

  assert.equal(deleteCalled, false);
  assert.equal(createCalled, false);
});

test('updateReviewRequest blocks non-reviewer approval attempts', async (t) => {
  const originalFindReview = prismaMock.reviewRequest.findUnique;
  const originalUpdateReview = prismaMock.reviewRequest.update;

  let updateCalled = false;

  prismaMock.reviewRequest.findUnique = async () => ({
    id: 'review-1',
    reviewerId: 'reviewer-1',
    status: 'PENDING',
    document: { tenantId: 'tenant-a' },
  });
  prismaMock.reviewRequest.update = async () => {
    updateCalled = true;
    return {};
  };

  t.after(() => {
    prismaMock.reviewRequest.findUnique = originalFindReview;
    prismaMock.reviewRequest.update = originalUpdateReview;
  });

  await assert.rejects(
    () =>
      complianceService.updateReviewRequest('review-1', {
        status: 'APPROVED',
        tenantId: 'tenant-a',
        actorUserId: 'attacker-user',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );

  assert.equal(updateCalled, false);
});

test('appendConversation rejects conversation hijack across users', async (t) => {
  const originalFindConversation = prismaMock.conversation.findUnique;
  const originalUpdateConversation = prismaMock.conversation.update;
  const originalCreateTrace = prismaMock.conversationTrace.create;

  let updateCalled = false;
  let traceCalled = false;

  prismaMock.conversation.findUnique = async () => ({
    id: 'conv-1',
    tenantId: 'tenant-a',
    userId: 'owner-user',
  });
  prismaMock.conversation.update = async () => {
    updateCalled = true;
    return {};
  };
  prismaMock.conversationTrace.create = async () => {
    traceCalled = true;
    return { id: 'trace-1' };
  };

  t.after(() => {
    prismaMock.conversation.findUnique = originalFindConversation;
    prismaMock.conversation.update = originalUpdateConversation;
    prismaMock.conversationTrace.create = originalCreateTrace;
  });

  await assert.rejects(
    () =>
      assistantService.appendConversation(
        {
          question: 'What is the rollout status?',
          conversationId: 'conv-1',
          tenantId: 'tenant-a',
          userId: 'attacker-user',
        },
        'Answer',
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );

  assert.equal(updateCalled, false);
  assert.equal(traceCalled, false);
});
