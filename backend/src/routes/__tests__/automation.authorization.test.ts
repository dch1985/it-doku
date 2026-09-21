import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../automation.js';
import { automationService } from '../../services/automation.service.js';

type RouteMethod = 'post' | 'patch';
type RouteHandler = (req: any, res: any, next?: any) => Promise<void>;

function getRouteHandler(method: RouteMethod, path: string): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as RouteHandler;
}

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
    send(body?: unknown) {
      this.payload = body;
      return this;
    },
  };

  return response;
}

const approveHandler = getRouteHandler('post', '/jobs/:id/approve');
const updateSuggestionHandler = getRouteHandler('patch', '/suggestions/:id');

const originalGetJobWithDetails = automationService.getJobWithDetails;
const originalApproveJob = automationService.approveJob;
const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
const originalUpdateSuggestion = automationService.updateSuggestion;

function restoreAutomationService() {
  (automationService as any).getJobWithDetails = originalGetJobWithDetails;
  (automationService as any).approveJob = originalApproveJob;
  (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
  (automationService as any).updateSuggestion = originalUpdateSuggestion;
}

test.afterEach(() => {
  restoreAutomationService();
});

test('rejects approving jobs from another tenant', async () => {
  let approveCalled = false;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  });
  (automationService as any).approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1' };
  };

  const req: any = {
    params: { id: 'job-1' },
    tenant: { id: 'tenant-a' },
  };
  const res = createMockResponse();

  await approveHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.payload, { error: 'Job nicht gefunden' });
  assert.equal(approveCalled, false);
});

test('allows approving jobs from same tenant', async () => {
  let approveCalled = false;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-1',
    tenantId: 'tenant-a',
  });
  (automationService as any).approveJob = async (id: string) => {
    approveCalled = true;
    return { id, status: 'COMPLETED' };
  };

  const req: any = {
    params: { id: 'job-1' },
    tenant: { id: 'tenant-a' },
  };
  const res = createMockResponse();

  await approveHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(approveCalled, true);
  assert.deepEqual(res.payload, { id: 'job-1', status: 'COMPLETED' });
});

test('rejects updating suggestions from another tenant', async () => {
  let updateCalled = false;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-1',
    generationJob: {
      id: 'job-1',
      tenantId: 'tenant-b',
    },
  });
  (automationService as any).updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  const req: any = {
    params: { id: 'suggestion-1' },
    body: { status: 'APPLIED' },
    tenant: { id: 'tenant-a' },
  };
  const res = createMockResponse();

  await updateSuggestionHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.payload, { error: 'Suggestion nicht gefunden' });
  assert.equal(updateCalled, false);
});

test('allows updating suggestions from same tenant', async () => {
  let updateCalled = false;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-1',
    generationJob: {
      id: 'job-1',
      tenantId: 'tenant-a',
    },
  });
  (automationService as any).updateSuggestion = async (_id: string, changes: { status: string }) => {
    updateCalled = true;
    return { id: 'suggestion-1', status: changes.status };
  };

  const req: any = {
    params: { id: 'suggestion-1' },
    body: { status: 'APPLIED' },
    tenant: { id: 'tenant-a' },
  };
  const res = createMockResponse();

  await updateSuggestionHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(updateCalled, true);
  assert.deepEqual(res.payload, { id: 'suggestion-1', status: 'APPLIED' });
});
