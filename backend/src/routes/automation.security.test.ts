import assert from 'node:assert/strict';
import test from 'node:test';

import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type RouteMethod = 'post' | 'patch';
type ExpressHandler = (req: any, res: any, next?: any) => unknown | Promise<unknown>;

function getRouteHandler(path: string, method: RouteMethod): ExpressHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );

  const handler = layer?.route?.stack?.[0]?.handle;
  if (!handler) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }
  return handler as ExpressHandler;
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

test('POST /jobs/:id/approve blocks cross-tenant approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-foreign',
    tenantId: 'tenant-b',
  });
  (automationService as any).approveJob = async () => {
    approveCalled = true;
    return { id: 'job-foreign', status: 'COMPLETED' };
  };

  try {
    const req = {
      params: { id: 'job-foreign' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('POST /jobs/:id/approve allows same-tenant approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-own',
    tenantId: 'tenant-a',
  });
  (automationService as any).approveJob = async (id: string) => {
    approveCalled = true;
    return { id, status: 'COMPLETED' };
  };

  try {
    const req = {
      params: { id: 'job-own' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(approveCalled, true);
    assert.deepEqual(res.body, { id: 'job-own', status: 'COMPLETED' });
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  const handler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-foreign',
    generationJob: { tenantId: 'tenant-b' },
  });
  (automationService as any).updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-foreign', status: 'APPLIED' };
  };

  try {
    const req = {
      params: { id: 'suggestion-foreign' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  const handler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-own',
    generationJob: { tenantId: 'tenant-a' },
  });
  (automationService as any).updateSuggestion = async (id: string, payload: { status: string; resolution?: string }) => {
    updateCalled = true;
    return { id, status: payload.status };
  };

  try {
    const req = {
      params: { id: 'suggestion-own' },
      tenant: { id: 'tenant-a' },
      body: { status: 'DISMISSED', resolution: 'Nicht nötig' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(updateCalled, true);
    assert.deepEqual(res.body, { id: 'suggestion-own', status: 'DISMISSED' });
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});
