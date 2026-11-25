import assert from 'node:assert/strict';
import test from 'node:test';
import automationRouter from '../src/routes/automation.js';
import { automationService } from '../src/services/automation.service.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload?: unknown) => MockResponse;
};

function getRouteHandler(path: string, method: 'post' | 'patch') {
  const layer = (automationRouter as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: Record<string, any>,
    res: MockResponse,
  ) => Promise<void>;
}

function createMockResponse(): MockResponse {
  const response = {
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
    send(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

test('POST /jobs/:id/approve denies cross-tenant access', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  let approveCalled = false;
  (automationService as any).getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-b' });
  (automationService as any).approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  };

  try {
    const req = { params: { id: 'job-1' }, tenant: { id: 'tenant-a' } };
    const res = createMockResponse();
    await approveHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('POST /jobs/:id/approve allows same-tenant access', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  (automationService as any).getJobWithDetails = async () => ({ id: 'job-2', tenantId: 'tenant-a' });
  (automationService as any).approveJob = async () => ({ id: 'job-2', status: 'COMPLETED' });

  try {
    const req = { params: { id: 'job-2' }, tenant: { id: 'tenant-a' } };
    const res = createMockResponse();
    await approveHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: 'job-2', status: 'COMPLETED' });
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id denies cross-tenant access', async () => {
  const suggestionHandler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = (automationService as any).getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  let updateCalled = false;
  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-1',
    generationJob: { id: 'job-1', tenantId: 'tenant-b' },
  });
  (automationService as any).updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  try {
    const req = {
      params: { id: 'suggestion-1' },
      body: { status: 'APPLIED', resolution: 'looks good' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();
    await suggestionHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});

test('PATCH /suggestions/:id allows same-tenant access', async () => {
  const suggestionHandler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = (automationService as any).getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-2',
    generationJob: { id: 'job-2', tenantId: 'tenant-a' },
  });
  (automationService as any).updateSuggestion = async () => ({
    id: 'suggestion-2',
    status: 'APPLIED',
  });

  try {
    const req = {
      params: { id: 'suggestion-2' },
      body: { status: 'APPLIED', resolution: 'approved' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();
    await suggestionHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { id: 'suggestion-2', status: 'APPLIED' });
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});
