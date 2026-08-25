import assert from 'node:assert/strict';
import test from 'node:test';
import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type RouteMethod = 'post' | 'patch';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload?: unknown) => MockResponse;
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
    send(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function getRouteHandler(path: string, method: RouteMethod) {
  const layer = (router as any).stack.find((stackLayer: any) => {
    return stackLayer.route?.path === path && stackLayer.route?.methods?.[method];
  });

  assert.ok(layer, `Route ${method.toUpperCase()} ${path} not found`);

  const handlerLayer = layer.route.stack[layer.route.stack.length - 1];
  assert.ok(handlerLayer?.handle, `Handler for ${method.toUpperCase()} ${path} not found`);
  return handlerLayer.handle as (req: any, res: any) => Promise<void>;
}

test('POST /jobs/:id/approve denies cross-tenant approval', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;
  let approveCalled = false;

  try {
    (automationService as any).getJobWithDetails = async () => ({ id: 'job-foreign', tenantId: 'tenant-b' });
    (automationService as any).approveJob = async () => {
      approveCalled = true;
      return { id: 'job-foreign', status: 'COMPLETED' };
    };

    const req = { params: { id: 'job-foreign' }, tenant: { id: 'tenant-a' } };
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

test('POST /jobs/:id/approve allows same-tenant approval', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;
  let approvedId: string | null = null;

  try {
    (automationService as any).getJobWithDetails = async () => ({ id: 'job-local', tenantId: 'tenant-a' });
    (automationService as any).approveJob = async (id: string) => {
      approvedId = id;
      return { id, status: 'COMPLETED' };
    };

    const req = { params: { id: 'job-local' }, tenant: { id: 'tenant-a' } };
    const res = createMockResponse();
    await approveHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(approvedId, 'job-local');
    assert.deepEqual(res.body, { id: 'job-local', status: 'COMPLETED' });
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id denies cross-tenant mutation', async () => {
  const updateHandler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = (automationService as any).getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;
  let updateCalled = false;

  try {
    (automationService as any).getSuggestionWithJob = async () => ({
      id: 'suggestion-foreign',
      generationJob: { id: 'job-foreign', tenantId: 'tenant-b' },
    });
    (automationService as any).updateSuggestion = async () => {
      updateCalled = true;
      return { id: 'suggestion-foreign', status: 'APPLIED' };
    };

    const req = {
      params: { id: 'suggestion-foreign' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED', resolution: 'Looks good' },
    };
    const res = createMockResponse();
    await updateHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});

test('PATCH /suggestions/:id allows same-tenant mutation', async () => {
  const updateHandler = getRouteHandler('/suggestions/:id', 'patch');
  const originalGetSuggestionWithJob = (automationService as any).getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;
  let updateInput: { id: string; status: string; resolution?: string } | null = null;

  try {
    (automationService as any).getSuggestionWithJob = async () => ({
      id: 'suggestion-local',
      generationJob: { id: 'job-local', tenantId: 'tenant-a' },
    });
    (automationService as any).updateSuggestion = async (
      id: string,
      payload: { status: string; resolution?: string },
    ) => {
      updateInput = { id, ...payload };
      return { id, status: payload.status, metadata: '{"resolution":"Applied"}' };
    };

    const req = {
      params: { id: 'suggestion-local' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED', resolution: 'Applied' },
    };
    const res = createMockResponse();
    await updateHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(updateInput, {
      id: 'suggestion-local',
      status: 'APPLIED',
      resolution: 'Applied',
    });
    assert.deepEqual(res.body, {
      id: 'suggestion-local',
      status: 'APPLIED',
      metadata: '{"resolution":"Applied"}',
    });
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});
