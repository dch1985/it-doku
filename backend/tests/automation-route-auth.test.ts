import test from 'node:test';
import assert from 'node:assert/strict';
import type { RequestHandler } from 'express';
import automationRouter from '../src/routes/automation.js';
import { automationService } from '../src/services/automation.service.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
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
}

function getRouteHandler(path: string, method: 'post' | 'patch'): RequestHandler {
  const layer = (automationRouter as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as RequestHandler;
}

test('POST /jobs/:id/approve blocks cross-tenant approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const service = automationService as any;
  const originalGetJobWithDetails = service.getJobWithDetails;
  const originalApproveJob = service.approveJob;

  let approveCalled = false;
  service.getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-a' });
  service.approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  };

  try {
    const req = {
      params: { id: 'job-1' },
      tenant: { id: 'tenant-b' },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    service.getJobWithDetails = originalGetJobWithDetails;
    service.approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  const handler = getRouteHandler('/suggestions/:id', 'patch');
  const service = automationService as any;
  const originalGetSuggestionWithTenant = service.getSuggestionWithTenant;
  const originalUpdateSuggestion = service.updateSuggestion;

  let updateCalled = false;
  service.getSuggestionWithTenant = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-a' },
  });
  service.updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  try {
    const req = {
      params: { id: 'suggestion-1' },
      tenant: { id: 'tenant-b' },
      body: { status: 'APPLIED' },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    service.getSuggestionWithTenant = originalGetSuggestionWithTenant;
    service.updateSuggestion = originalUpdateSuggestion;
  }
});

test('POST /jobs/:id/approve allows same-tenant approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const service = automationService as any;
  const originalGetJobWithDetails = service.getJobWithDetails;
  const originalApproveJob = service.approveJob;

  service.getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-a' });
  service.approveJob = async () => ({ id: 'job-1', status: 'COMPLETED' });

  try {
    const req = {
      params: { id: 'job-1' },
      tenant: { id: 'tenant-a' },
    } as any;
    const res = createMockResponse();

    await handler(req, res as any, () => undefined);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: 'job-1', status: 'COMPLETED' });
  } finally {
    service.getJobWithDetails = originalGetJobWithDetails;
    service.approveJob = originalApproveJob;
  }
});
