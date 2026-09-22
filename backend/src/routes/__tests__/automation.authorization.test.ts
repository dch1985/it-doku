import test from 'node:test';
import assert from 'node:assert/strict';
import automationRouter from '../automation.js';
import { automationService } from '../../services/automation.service.js';

type MockResponse = {
  statusCode: number;
  payload: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload?: unknown) => MockResponse;
};

function getRouteHandler(path: string, method: 'post' | 'patch') {
  const layer = (automationRouter as any).stack.find(
    (entry: any) => entry.route?.path === path && Boolean(entry.route?.methods?.[method]),
  );
  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: any,
    res: MockResponse,
  ) => Promise<void>;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
    send(payload?: unknown) {
      this.payload = payload;
      return this;
    },
  };
}

function stubServiceMethod(method: keyof typeof automationService, replacement: any) {
  const original = (automationService as any)[method];
  (automationService as any)[method] = replacement;
  return () => {
    (automationService as any)[method] = original;
  };
}

test('POST /jobs/:id/approve blocks cross-tenant approvals', async () => {
  const restoreGetJob = stubServiceMethod('getJobWithDetails', async () => ({
    id: 'job-foreign',
    tenantId: 'tenant-b',
  }));

  let approveCalled = false;
  const restoreApprove = stubServiceMethod('approveJob', async () => {
    approveCalled = true;
    return { id: 'job-foreign', status: 'COMPLETED' };
  });

  try {
    const handler = getRouteHandler('/jobs/:id/approve', 'post');
    const req = {
      params: { id: 'job-foreign' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.payload, { error: 'Job nicht gefunden' });
    assert.equal(approveCalled, false);
  } finally {
    restoreGetJob();
    restoreApprove();
  }
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  const restoreGetSuggestion = stubServiceMethod('getSuggestionWithJob', async () => ({
    id: 'suggestion-foreign',
    generationJob: { id: 'job-foreign', tenantId: 'tenant-b' },
  }));

  let updateCalled = false;
  const restoreUpdate = stubServiceMethod('updateSuggestion', async () => {
    updateCalled = true;
    return { id: 'suggestion-foreign', status: 'APPLIED' };
  });

  try {
    const handler = getRouteHandler('/suggestions/:id', 'patch');
    const req = {
      params: { id: 'suggestion-foreign' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.payload, { error: 'Vorschlag nicht gefunden' });
    assert.equal(updateCalled, false);
  } finally {
    restoreGetSuggestion();
    restoreUpdate();
  }
});

test('POST /jobs/:id/approve allows same-tenant approvals', async () => {
  const restoreGetJob = stubServiceMethod('getJobWithDetails', async () => ({
    id: 'job-own',
    tenantId: 'tenant-a',
  }));
  const restoreApprove = stubServiceMethod('approveJob', async () => ({
    id: 'job-own',
    status: 'COMPLETED',
  }));

  try {
    const handler = getRouteHandler('/jobs/:id/approve', 'post');
    const req = {
      params: { id: 'job-own' },
      tenant: { id: 'tenant-a' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { id: 'job-own', status: 'COMPLETED' });
  } finally {
    restoreGetJob();
    restoreApprove();
  }
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  const restoreGetSuggestion = stubServiceMethod('getSuggestionWithJob', async () => ({
    id: 'suggestion-own',
    generationJob: { id: 'job-own', tenantId: 'tenant-a' },
  }));
  const restoreUpdate = stubServiceMethod('updateSuggestion', async () => ({
    id: 'suggestion-own',
    status: 'APPLIED',
  }));

  try {
    const handler = getRouteHandler('/suggestions/:id', 'patch');
    const req = {
      params: { id: 'suggestion-own' },
      tenant: { id: 'tenant-a' },
      body: { status: 'APPLIED' },
    };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { id: 'suggestion-own', status: 'APPLIED' });
  } finally {
    restoreGetSuggestion();
    restoreUpdate();
  }
});

