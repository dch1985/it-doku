import test from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '../src/lib/prisma.js';
import { complianceService } from '../src/services/compliance.service.js';
import { assistantService } from '../src/services/assistant.service.js';
import automationRouter from '../src/routes/automation.js';
import { automationService } from '../src/services/automation.service.js';
import { ApplicationError } from '../src/middleware/errorHandler.js';

const prismaMock = prisma as any;

function getRouteHandler(router: any, method: 'post' | 'patch', path: string) {
  const layer = router.stack.find((entry: any) => entry.route?.path === path && entry.route?.methods?.[method]);
  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[0].handle as (req: any, res: any) => Promise<void>;
}

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

test('runQualityChecks rejects cross-tenant access before deleting findings', async (t) => {
  const originalDocumentModel = prismaMock.document;
  const originalQualityFindingModel = prismaMock.qualityFinding;
  prismaMock.document = prismaMock.document ?? {};
  prismaMock.qualityFinding = prismaMock.qualityFinding ?? {};

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
    if (originalDocumentModel === undefined) {
      delete prismaMock.document;
    } else {
      prismaMock.document = originalDocumentModel;
      prismaMock.document.findUnique = originalFindDocument;
    }

    if (originalQualityFindingModel === undefined) {
      delete prismaMock.qualityFinding;
    } else {
      prismaMock.qualityFinding = originalQualityFindingModel;
      prismaMock.qualityFinding.deleteMany = originalDeleteFindings;
      prismaMock.qualityFinding.createMany = originalCreateFindings;
    }
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
  const originalReviewRequestModel = prismaMock.reviewRequest;
  prismaMock.reviewRequest = prismaMock.reviewRequest ?? {};
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
    if (originalReviewRequestModel === undefined) {
      delete prismaMock.reviewRequest;
    } else {
      prismaMock.reviewRequest = originalReviewRequestModel;
      prismaMock.reviewRequest.findUnique = originalFindReview;
      prismaMock.reviewRequest.update = originalUpdateReview;
    }
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
  const originalConversationModel = prismaMock.conversation;
  const originalConversationTraceModel = prismaMock.conversationTrace;
  prismaMock.conversation = prismaMock.conversation ?? {};
  prismaMock.conversationTrace = prismaMock.conversationTrace ?? {};

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
    if (originalConversationModel === undefined) {
      delete prismaMock.conversation;
    } else {
      prismaMock.conversation = originalConversationModel;
      prismaMock.conversation.findUnique = originalFindConversation;
      prismaMock.conversation.update = originalUpdateConversation;
    }

    if (originalConversationTraceModel === undefined) {
      delete prismaMock.conversationTrace;
    } else {
      prismaMock.conversationTrace = originalConversationTraceModel;
      prismaMock.conversationTrace.create = originalCreateTrace;
    }
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

test('approve job route denies cross-tenant approval attempts', async (t) => {
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;
  const approveHandler = getRouteHandler(automationRouter as any, 'post', '/jobs/:id/approve');

  let approveCalled = false;
  automationService.getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-a' } as any);
  automationService.approveJob = async () => {
    approveCalled = true;
    return {} as any;
  };

  t.after(() => {
    automationService.getJobWithDetails = originalGetJobWithDetails;
    automationService.approveJob = originalApproveJob;
  });

  const req: any = { params: { id: 'job-1' }, tenant: { id: 'tenant-b' } };
  const res = createMockResponse();

  await approveHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Job nicht gefunden' });
  assert.equal(approveCalled, false);
});

test('update suggestion route denies cross-tenant mutations', async (t) => {
  const originalGetSuggestionWithContext = automationService.getSuggestionWithContext;
  const originalUpdateSuggestion = automationService.updateSuggestion;
  const updateSuggestionHandler = getRouteHandler(automationRouter as any, 'patch', '/suggestions/:id');

  let updateCalled = false;
  automationService.getSuggestionWithContext = async () =>
    ({
      id: 'suggestion-1',
      generationJob: { id: 'job-1', tenantId: 'tenant-a' },
    }) as any;
  automationService.updateSuggestion = async () => {
    updateCalled = true;
    return {} as any;
  };

  t.after(() => {
    automationService.getSuggestionWithContext = originalGetSuggestionWithContext;
    automationService.updateSuggestion = originalUpdateSuggestion;
  });

  const req: any = {
    params: { id: 'suggestion-1' },
    tenant: { id: 'tenant-b' },
    body: { status: 'APPLIED' },
  };
  const res = createMockResponse();

  await updateSuggestionHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
  assert.equal(updateCalled, false);
});
