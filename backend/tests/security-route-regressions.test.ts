import assert from 'node:assert/strict';
import test from 'node:test';

import automationRouter from '../src/routes/automation.js';
import complianceRouter from '../src/routes/compliance.js';
import { automationService } from '../src/services/automation.service.js';
import { complianceService } from '../src/services/compliance.service.js';

type RouteHandler = (req: any, res: any, next?: any) => Promise<unknown> | unknown;

function getRouteHandler(router: any, method: string, path: string): RouteHandler {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method.toLowerCase()]
  );

  assert.ok(layer, `Route ${method.toUpperCase()} ${path} not found`);

  return layer.route.stack[layer.route.stack.length - 1].handle as RouteHandler;
}

function createMockResponse() {
  const state: { statusCode: number; body: any } = {
    statusCode: 200,
    body: undefined,
  };

  const res: any = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(body: any) {
      state.body = body;
      return this;
    },
    send(body?: any) {
      state.body = body;
      return this;
    },
  };

  return { res, state };
}

test('PATCH /reviews/:id keeps existing comments when comments field is omitted', async () => {
  const handler = getRouteHandler(complianceRouter, 'patch', '/reviews/:id');
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;

  let capturedPayload: any = null;
  (complianceService as any).updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: 'review-1', status: payload.status ?? 'PENDING' };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 200);
    assert.equal(capturedPayload.status, 'APPROVED');
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload, 'comments'), false);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /reviews/:id forwards explicit null comments updates', async () => {
  const handler = getRouteHandler(complianceRouter, 'patch', '/reviews/:id');
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;

  let capturedPayload: any = null;
  (complianceService as any).updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: 'review-2', comments: payload.comments };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'review-2' },
      body: { comments: null },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 200);
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload, 'comments'), true);
    assert.equal(capturedPayload.comments, null);
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('POST /jobs/:id/approve blocks cross-tenant job approvals', async () => {
  const handler = getRouteHandler(automationRouter, 'post', '/jobs/:id/approve');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;
  (automationService as any).getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-b' });
  (automationService as any).approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'job-1' },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 404);
    assert.deepEqual(state.body, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('POST /jobs/:id/approve allows same-tenant approvals', async () => {
  const handler = getRouteHandler(automationRouter, 'post', '/jobs/:id/approve');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveArg: string | null = null;
  (automationService as any).getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-a' });
  (automationService as any).approveJob = async (id: string) => {
    approveArg = id;
    return { id, status: 'COMPLETED' };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'job-1' },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 200);
    assert.equal(approveArg, 'job-1');
    assert.deepEqual(state.body, { id: 'job-1', status: 'COMPLETED' });
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id blocks cross-tenant suggestion updates', async () => {
  const handler = getRouteHandler(automationRouter, 'patch', '/suggestions/:id');
  const originalGetSuggestionWithTenant = (automationService as any).getSuggestionWithTenant;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;
  (automationService as any).getSuggestionWithTenant = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-b' },
  });
  (automationService as any).updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'suggestion-1' },
      body: { status: 'APPLIED' },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 404);
    assert.deepEqual(state.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    (automationService as any).getSuggestionWithTenant = originalGetSuggestionWithTenant;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  const handler = getRouteHandler(automationRouter, 'patch', '/suggestions/:id');
  const originalGetSuggestionWithTenant = (automationService as any).getSuggestionWithTenant;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let capturedUpdate: any = null;
  (automationService as any).getSuggestionWithTenant = async () => ({
    id: 'suggestion-2',
    generationJob: { tenantId: 'tenant-a' },
  });
  (automationService as any).updateSuggestion = async (_id: string, payload: any) => {
    capturedUpdate = payload;
    return { id: 'suggestion-2', status: 'APPLIED' };
  };

  try {
    const { res, state } = createMockResponse();
    const req: any = {
      params: { id: 'suggestion-2' },
      body: { status: 'APPLIED', resolution: 'Valid change' },
      tenant: { id: 'tenant-a' },
    };

    await handler(req, res);

    assert.equal(state.statusCode, 200);
    assert.deepEqual(capturedUpdate, { status: 'APPLIED', resolution: 'Valid change' });
    assert.deepEqual(state.body, { id: 'suggestion-2', status: 'APPLIED' });
  } finally {
    (automationService as any).getSuggestionWithTenant = originalGetSuggestionWithTenant;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});
