import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import router from './automation.js';
import { automationService } from '../services/automation.service.js';

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>;

function getRouteHandler(path: string, method: 'post' | 'patch'): AsyncRouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle as AsyncRouteHandler;
}

function createMockResponse() {
  let statusCode = 200;
  let jsonBody: unknown;

  const response = {
    status(code: number) {
      statusCode = code;
      return response as unknown as Response;
    },
    json(body: unknown) {
      jsonBody = body;
      return response as unknown as Response;
    },
  } as unknown as Response;

  return {
    response,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
  };
}

async function withServiceStubs(stubs: Record<string, unknown>, run: () => Promise<void>) {
  const originals = new Map<string, unknown>();
  for (const [method, stub] of Object.entries(stubs)) {
    originals.set(method, (automationService as any)[method]);
    (automationService as any)[method] = stub;
  }

  try {
    await run();
  } finally {
    for (const [method, original] of originals.entries()) {
      (automationService as any)[method] = original;
    }
  }
}

test('POST /jobs/:id/approve blocks cross-tenant approvals', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  let approveCalled = false;

  await withServiceStubs(
    {
      getJobWithDetails: async () => ({ id: 'job-1', tenantId: 'tenant-a' }),
      approveJob: async () => {
        approveCalled = true;
        return { id: 'job-1', status: 'COMPLETED' };
      },
    },
    async () => {
      const { response, getStatusCode, getJsonBody } = createMockResponse();
      const req = {
        params: { id: 'job-1' },
        tenant: { id: 'tenant-b' },
      } as unknown as Request;

      await approveHandler(req, response);

      assert.equal(getStatusCode(), 404);
      assert.deepEqual(getJsonBody(), { error: 'Job nicht gefunden' });
      assert.equal(approveCalled, false);
    }
  );
});

test('POST /jobs/:id/approve allows matching tenant approvals', async () => {
  const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
  let approveCalled = false;

  await withServiceStubs(
    {
      getJobWithDetails: async () => ({ id: 'job-1', tenantId: 'tenant-a' }),
      approveJob: async (id: string) => {
        approveCalled = true;
        return { id, status: 'COMPLETED' };
      },
    },
    async () => {
      const { response, getStatusCode, getJsonBody } = createMockResponse();
      const req = {
        params: { id: 'job-1' },
        tenant: { id: 'tenant-a' },
      } as unknown as Request;

      await approveHandler(req, response);

      assert.equal(getStatusCode(), 200);
      assert.deepEqual(getJsonBody(), { id: 'job-1', status: 'COMPLETED' });
      assert.equal(approveCalled, true);
    }
  );
});

test('PATCH /suggestions/:id blocks cross-tenant updates', async () => {
  const patchHandler = getRouteHandler('/suggestions/:id', 'patch');
  let updateCalled = false;

  await withServiceStubs(
    {
      getSuggestionWithDetails: async () => ({
        id: 'suggestion-1',
        generationJob: { id: 'job-1', tenantId: 'tenant-a' },
      }),
      updateSuggestion: async () => {
        updateCalled = true;
        return { id: 'suggestion-1', status: 'APPLIED' };
      },
    },
    async () => {
      const { response, getStatusCode, getJsonBody } = createMockResponse();
      const req = {
        params: { id: 'suggestion-1' },
        tenant: { id: 'tenant-b' },
        body: { status: 'APPLIED' },
      } as unknown as Request;

      await patchHandler(req, response);

      assert.equal(getStatusCode(), 404);
      assert.deepEqual(getJsonBody(), { error: 'Suggestion nicht gefunden' });
      assert.equal(updateCalled, false);
    }
  );
});

test('PATCH /suggestions/:id allows matching tenant updates', async () => {
  const patchHandler = getRouteHandler('/suggestions/:id', 'patch');
  let receivedStatus = '';

  await withServiceStubs(
    {
      getSuggestionWithDetails: async () => ({
        id: 'suggestion-1',
        generationJob: { id: 'job-1', tenantId: 'tenant-a' },
      }),
      updateSuggestion: async (_id: string, payload: { status: string }) => {
        receivedStatus = payload.status;
        return { id: 'suggestion-1', status: payload.status };
      },
    },
    async () => {
      const { response, getStatusCode, getJsonBody } = createMockResponse();
      const req = {
        params: { id: 'suggestion-1' },
        tenant: { id: 'tenant-a' },
        body: { status: 'DISMISSED' },
      } as unknown as Request;

      await patchHandler(req, response);

      assert.equal(getStatusCode(), 200);
      assert.deepEqual(getJsonBody(), { id: 'suggestion-1', status: 'DISMISSED' });
      assert.equal(receivedStatus, 'DISMISSED');
    }
  );
});
