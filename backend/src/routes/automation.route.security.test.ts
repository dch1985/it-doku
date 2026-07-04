import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type RouteHandler = (req: Request, res: Response) => Promise<void>;

function getRouteHandler(path: string, method: 'post' | 'patch'): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[0].handle as RouteHandler;
}

function createMockResponse() {
  const state: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: undefined,
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  } as Response;

  return { res, state };
}

test('POST /jobs/:id/approve rejects cross-tenant access', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');

  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;
  automationService.getJobWithDetails = (async () =>
    ({ id: 'job-b', tenantId: 'tenant-b' }) as any) as typeof automationService.getJobWithDetails;
  automationService.approveJob = (async () => {
    approveCalled = true;
    return { id: 'job-b', status: 'COMPLETED' } as any;
  }) as typeof automationService.approveJob;

  try {
    const req = {
      params: { id: 'job-b' },
      tenant: { id: 'tenant-a' },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    await approveHandler(req, res);

    assert.equal(state.statusCode, 404);
    assert.deepEqual(state.body, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    automationService.getJobWithDetails = originalGetJobWithDetails;
    automationService.approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id rejects cross-tenant updates', async () => {
  const suggestionHandler = getRouteHandler('/suggestions/:id', 'patch');

  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;
  automationService.getSuggestionWithJob = (async () =>
    ({
      id: 'suggestion-b',
      generationJob: { tenantId: 'tenant-b' },
    }) as any) as typeof automationService.getSuggestionWithJob;
  automationService.updateSuggestion = (async () => {
    updateCalled = true;
    return { id: 'suggestion-b', status: 'APPLIED' } as any;
  }) as typeof automationService.updateSuggestion;

  try {
    const req = {
      params: { id: 'suggestion-b' },
      body: { status: 'APPLIED' },
      tenant: { id: 'tenant-a' },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    await suggestionHandler(req, res);

    assert.equal(state.statusCode, 404);
    assert.deepEqual(state.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    automationService.getSuggestionWithJob = originalGetSuggestionWithJob;
    automationService.updateSuggestion = originalUpdateSuggestion;
  }
});

test('POST /jobs/:id/approve allows same-tenant access', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');

  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;
  automationService.getJobWithDetails = (async () =>
    ({ id: 'job-a', tenantId: 'tenant-a' }) as any) as typeof automationService.getJobWithDetails;
  automationService.approveJob = (async (id: string) => {
    approveCalled = true;
    return { id, status: 'COMPLETED' } as any;
  }) as typeof automationService.approveJob;

  try {
    const req = {
      params: { id: 'job-a' },
      tenant: { id: 'tenant-a' },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    await approveHandler(req, res);

    assert.equal(state.statusCode, 200);
    assert.deepEqual(state.body, { id: 'job-a', status: 'COMPLETED' });
    assert.equal(approveCalled, true);
  } finally {
    automationService.getJobWithDetails = originalGetJobWithDetails;
    automationService.approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  const suggestionHandler = getRouteHandler('/suggestions/:id', 'patch');

  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;
  automationService.getSuggestionWithJob = (async () =>
    ({
      id: 'suggestion-a',
      generationJob: { tenantId: 'tenant-a' },
    }) as any) as typeof automationService.getSuggestionWithJob;
  automationService.updateSuggestion = (async (_id: string, input: { status: string }) => {
    updateCalled = true;
    return { id: 'suggestion-a', status: input.status } as any;
  }) as typeof automationService.updateSuggestion;

  try {
    const req = {
      params: { id: 'suggestion-a' },
      body: { status: 'APPLIED' },
      tenant: { id: 'tenant-a' },
    } as unknown as Request;
    const { res, state } = createMockResponse();

    await suggestionHandler(req, res);

    assert.equal(state.statusCode, 200);
    assert.deepEqual(state.body, { id: 'suggestion-a', status: 'APPLIED' });
    assert.equal(updateCalled, true);
  } finally {
    automationService.getSuggestionWithJob = originalGetSuggestionWithJob;
    automationService.updateSuggestion = originalUpdateSuggestion;
  }
});
