import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type RouteMethod = 'post' | 'patch';

function getRouteHandler(path: string, method: RouteMethod) {
  const layer = (router as any).stack.find(
    (stackLayer: any) =>
      stackLayer?.route?.path === path &&
      stackLayer?.route?.methods?.[method] === true,
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} wurde nicht gefunden`);
  }

  const routeLayer = layer.route.stack.find(
    (candidate: any) => candidate?.method === method,
  );

  if (!routeLayer) {
    throw new Error(`Route-Handler ${method.toUpperCase()} ${path} wurde nicht gefunden`);
  }

  return routeLayer.handle as (
    req: Request,
    res: Response,
  ) => Promise<Response | void>;
}

function createMockResponse() {
  const response: Partial<Response> & { statusCode: number; body?: unknown } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this as Response;
    },
    json(payload: unknown) {
      this.body = payload;
      return this as Response;
    },
  };

  return response as Response & { statusCode: number; body?: unknown };
}

const approveJobHandler = getRouteHandler('/jobs/:id/approve', 'post');
const updateSuggestionHandler = getRouteHandler('/suggestions/:id', 'patch');

test('POST /jobs/:id/approve blocks cross-tenant approvals', async () => {
  const req = {
    params: { id: 'job-1' },
    tenant: { id: 'tenant-a' },
  } as unknown as Request;
  const res = createMockResponse();

  let approveCalled = false;
  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-1',
    tenantId: 'tenant-b',
  });
  (automationService as any).approveJob = async () => {
    approveCalled = true;
    return { id: 'job-1', status: 'COMPLETED' };
  };

  try {
    await approveJobHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(approveCalled, false);
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('POST /jobs/:id/approve allows same-tenant approvals', async () => {
  const req = {
    params: { id: 'job-2' },
    tenant: { id: 'tenant-a' },
  } as unknown as Request;
  const res = createMockResponse();
  const approvedJob = { id: 'job-2', status: 'COMPLETED' };

  const originalGetJobWithDetails = automationService.getJobWithDetails;
  const originalApproveJob = automationService.approveJob;

  (automationService as any).getJobWithDetails = async () => ({
    id: 'job-2',
    tenantId: 'tenant-a',
  });
  (automationService as any).approveJob = async () => approvedJob;

  try {
    await approveJobHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, approvedJob);
  } finally {
    (automationService as any).getJobWithDetails = originalGetJobWithDetails;
    (automationService as any).approveJob = originalApproveJob;
  }
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  const req = {
    params: { id: 'suggestion-1' },
    body: { status: 'APPLIED' },
    tenant: { id: 'tenant-a' },
  } as unknown as Request;
  const res = createMockResponse();

  let updateCalled = false;
  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-1',
    generationJob: { tenantId: 'tenant-b' },
  });
  (automationService as any).updateSuggestion = async () => {
    updateCalled = true;
    return { id: 'suggestion-1', status: 'APPLIED' };
  };

  try {
    await updateSuggestionHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(updateCalled, false);
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});

test('PATCH /suggestions/:id allows same-tenant updates', async () => {
  const req = {
    params: { id: 'suggestion-2' },
    body: { status: 'DISMISSED', resolution: 'Nicht relevant' },
    tenant: { id: 'tenant-a' },
  } as unknown as Request;
  const res = createMockResponse();
  const updatedSuggestion = { id: 'suggestion-2', status: 'DISMISSED' };

  const originalGetSuggestionWithJob = automationService.getSuggestionWithJob;
  const originalUpdateSuggestion = automationService.updateSuggestion;

  (automationService as any).getSuggestionWithJob = async () => ({
    id: 'suggestion-2',
    generationJob: { tenantId: 'tenant-a' },
  });
  (automationService as any).updateSuggestion = async () => updatedSuggestion;

  try {
    await updateSuggestionHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, updatedSuggestion);
  } finally {
    (automationService as any).getSuggestionWithJob = originalGetSuggestionWithJob;
    (automationService as any).updateSuggestion = originalUpdateSuggestion;
  }
});
