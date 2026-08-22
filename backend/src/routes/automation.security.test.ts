import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type RouteMethod = 'post' | 'patch';
type Handler = (req: any, res: any) => Promise<void>;

const originalMethods = {
  getJobWithDetails: automationService.getJobWithDetails,
  approveJob: automationService.approveJob,
  getSuggestionWithJob: automationService.getSuggestionWithJob,
  updateSuggestion: automationService.updateSuggestion,
};

afterEach(() => {
  automationService.getJobWithDetails = originalMethods.getJobWithDetails;
  automationService.approveJob = originalMethods.approveJob;
  automationService.getSuggestionWithJob = originalMethods.getSuggestionWithJob;
  automationService.updateSuggestion = originalMethods.updateSuggestion;
});

function getRouteHandler(path: string, method: RouteMethod): Handler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as Handler;
}

function createResponse() {
  const res: any = {
    statusCode: 200,
    body: undefined as unknown,
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
  };

  return res;
}

const approveJobHandler = getRouteHandler('/jobs/:id/approve', 'post');
const updateSuggestionHandler = getRouteHandler('/suggestions/:id', 'patch');

test('POST /jobs/:id/approve blocks cross-tenant approvals', async () => {
  let approveCalled = false;

  automationService.getJobWithDetails = async () =>
    ({ id: 'job-1', tenantId: 'tenant-b' }) as any;
  automationService.approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1', status: 'COMPLETED' } as any;
  };

  const req: any = { params: { id: 'job-1' }, tenant: { id: 'tenant-a' } };
  const res = createResponse();

  await approveJobHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Job nicht gefunden' });
  assert.equal(approveCalled, false);
});

test('POST /jobs/:id/approve allows same-tenant approvals', async () => {
  automationService.getJobWithDetails = async () =>
    ({ id: 'job-1', tenantId: 'tenant-a' }) as any;
  automationService.approveJob = async (id: string) =>
    ({ id, status: 'COMPLETED' }) as any;

  const req: any = { params: { id: 'job-1' }, tenant: { id: 'tenant-a' } };
  const res = createResponse();

  await approveJobHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { id: 'job-1', status: 'COMPLETED' });
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  let updateCalled = false;

  automationService.getSuggestionWithJob = async () =>
    ({
      id: 'suggestion-1',
      generationJob: { id: 'job-1', tenantId: 'tenant-b' },
    }) as any;
  automationService.updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' } as any;
  };

  const req: any = {
    params: { id: 'suggestion-1' },
    tenant: { id: 'tenant-a' },
    body: { status: 'APPLIED', resolution: 'done' },
  };
  const res = createResponse();

  await updateSuggestionHandler(req, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Suggestion nicht gefunden' });
  assert.equal(updateCalled, false);
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  automationService.getSuggestionWithJob = async () =>
    ({
      id: 'suggestion-1',
      generationJob: { id: 'job-1', tenantId: 'tenant-a' },
    }) as any;
  automationService.updateSuggestion = async (id: string, changes: { status: string; resolution?: string }) =>
    ({ id, status: changes.status.toUpperCase() }) as any;

  const req: any = {
    params: { id: 'suggestion-1' },
    tenant: { id: 'tenant-a' },
    body: { status: 'applied', resolution: 'done' },
  };
  const res = createResponse();

  await updateSuggestionHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { id: 'suggestion-1', status: 'APPLIED' });
});
