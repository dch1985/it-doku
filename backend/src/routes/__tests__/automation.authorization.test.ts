import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../automation.js';
import { automationService } from '../../services/automation.service.js';

type HttpMethod = 'post' | 'patch';
type RouteHandler = (req: unknown, res: unknown) => Promise<void>;

function getRouteHandler(method: HttpMethod, path: string): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} wurde nicht gefunden`);
  }

  const handler = layer.route?.stack?.[0]?.handle;
  if (typeof handler !== 'function') {
    throw new Error(`Kein Handler für ${method.toUpperCase()} ${path} gefunden`);
  }

  return handler as RouteHandler;
}

function createMockResponse() {
  const payload: { statusCode: number; body?: unknown } = { statusCode: 200 };
  const res: any = {
    status(code: number) {
      payload.statusCode = code;
      return res;
    },
    json(body: unknown) {
      payload.body = body;
      return res;
    },
  };

  return { res, payload };
}

test('POST /jobs/:id/approve blocks cross-tenant approvals', async (t) => {
  const handler = getRouteHandler('post', '/jobs/:id/approve');
  const service = automationService as any;
  const originalGetJobWithDetails = service.getJobWithDetails;
  const originalApproveJob = service.approveJob;
  let approveCalled = false;

  service.getJobWithDetails = async () => ({ id: 'job-b', tenantId: 'tenant-b' });
  service.approveJob = async () => {
    approveCalled = true;
    return { id: 'job-b', status: 'COMPLETED' };
  };

  t.after(() => {
    service.getJobWithDetails = originalGetJobWithDetails;
    service.approveJob = originalApproveJob;
  });

  const { res, payload } = createMockResponse();
  await handler(
    {
      params: { id: 'job-b' },
      tenant: { id: 'tenant-a' },
    },
    res
  );

  assert.equal(payload.statusCode, 404);
  assert.deepEqual(payload.body, { error: 'Job nicht gefunden' });
  assert.equal(approveCalled, false);
});

test('POST /jobs/:id/approve allows same-tenant approvals', async (t) => {
  const handler = getRouteHandler('post', '/jobs/:id/approve');
  const service = automationService as any;
  const originalGetJobWithDetails = service.getJobWithDetails;
  const originalApproveJob = service.approveJob;
  let approvedId: string | null = null;

  service.getJobWithDetails = async () => ({ id: 'job-a', tenantId: 'tenant-a' });
  service.approveJob = async (id: string) => {
    approvedId = id;
    return { id, status: 'COMPLETED' };
  };

  t.after(() => {
    service.getJobWithDetails = originalGetJobWithDetails;
    service.approveJob = originalApproveJob;
  });

  const { res, payload } = createMockResponse();
  await handler(
    {
      params: { id: 'job-a' },
      tenant: { id: 'tenant-a' },
    },
    res
  );

  assert.equal(payload.statusCode, 200);
  assert.equal(approvedId, 'job-a');
  assert.deepEqual(payload.body, { id: 'job-a', status: 'COMPLETED' });
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async (t) => {
  const handler = getRouteHandler('patch', '/suggestions/:id');
  const service = automationService as any;
  const originalGetSuggestionWithJob = service.getSuggestionWithJob;
  const originalUpdateSuggestion = service.updateSuggestion;
  let updateCalled = false;

  service.getSuggestionWithJob = async () => ({
    id: 'suggestion-b',
    generationJobId: 'job-b',
    generationJob: { tenantId: 'tenant-b' },
  });
  service.updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-b', status: 'APPLIED' };
  };

  t.after(() => {
    service.getSuggestionWithJob = originalGetSuggestionWithJob;
    service.updateSuggestion = originalUpdateSuggestion;
  });

  const { res, payload } = createMockResponse();
  await handler(
    {
      params: { id: 'suggestion-b' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED' },
    },
    res
  );

  assert.equal(payload.statusCode, 404);
  assert.deepEqual(payload.body, { error: 'Suggestion nicht gefunden' });
  assert.equal(updateCalled, false);
});

test('PATCH /suggestions/:id allows same-tenant updates', async (t) => {
  const handler = getRouteHandler('patch', '/suggestions/:id');
  const service = automationService as any;
  const originalGetSuggestionWithJob = service.getSuggestionWithJob;
  const originalUpdateSuggestion = service.updateSuggestion;
  let receivedId: string | null = null;
  let receivedPayload: unknown = null;

  service.getSuggestionWithJob = async () => ({
    id: 'suggestion-a',
    generationJobId: 'job-a',
    generationJob: { tenantId: 'tenant-a' },
  });
  service.updateSuggestion = async (id: string, payload: unknown) => {
    receivedId = id;
    receivedPayload = payload;
    return { id, status: 'APPLIED' };
  };

  t.after(() => {
    service.getSuggestionWithJob = originalGetSuggestionWithJob;
    service.updateSuggestion = originalUpdateSuggestion;
  });

  const { res, payload } = createMockResponse();
  await handler(
    {
      params: { id: 'suggestion-a' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED', resolution: 'Looks good' },
    },
    res
  );

  assert.equal(payload.statusCode, 200);
  assert.equal(receivedId, 'suggestion-a');
  assert.deepEqual(receivedPayload, { status: 'APPLIED', resolution: 'Looks good' });
  assert.deepEqual(payload.body, { id: 'suggestion-a', status: 'APPLIED' });
});
