import assert from 'node:assert/strict';
import test from 'node:test';

process.env.AUTOMATION_QUEUE_AUTORUN = 'false';
process.env.AUTOMATION_RUN_IMMEDIATE = 'false';

const { default: router } = await import('./automation.js');
const { automationService } = await import('../services/automation.service.js');

type RouteHandler = (req: any, res: any) => Promise<void>;

function getRouteHandler(path: string, method: 'post' | 'patch'): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method]
  );
  assert.ok(layer, `Route not found: [${method.toUpperCase()}] ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle as RouteHandler;
}

function createResponse() {
  const response: any = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.payload = body;
      return response;
    },
    send(body?: unknown) {
      response.payload = body;
      return response;
    },
  };

  return response;
}

async function withServiceMocks(
  mocks: Record<string, unknown>,
  run: () => Promise<void>
) {
  const originals = new Map<string, unknown>();
  for (const [key, value] of Object.entries(mocks)) {
    originals.set(key, (automationService as any)[key]);
    (automationService as any)[key] = value;
  }

  try {
    await run();
  } finally {
    for (const [key, value] of originals.entries()) {
      (automationService as any)[key] = value;
    }
  }
}

test('POST /jobs/:id/approve rejects cross-tenant job approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const response = createResponse();
  let approveCalls = 0;

  await withServiceMocks(
    {
      getJobWithDetails: async () => ({ id: 'job-foreign', tenantId: 'tenant-b' }),
      approveJob: async () => {
        approveCalls += 1;
        return { id: 'job-foreign', status: 'COMPLETED' };
      },
    },
    async () => {
      await handler(
        { params: { id: 'job-foreign' }, tenant: { id: 'tenant-a' } },
        response
      );
    }
  );

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.payload, { error: 'Job nicht gefunden' });
  assert.equal(approveCalls, 0);
});

test('POST /jobs/:id/approve allows same-tenant approval', async () => {
  const handler = getRouteHandler('/jobs/:id/approve', 'post');
  const response = createResponse();
  let approveCalls = 0;

  await withServiceMocks(
    {
      getJobWithDetails: async () => ({ id: 'job-own', tenantId: 'tenant-a' }),
      approveJob: async (id: string) => {
        approveCalls += 1;
        return { id, status: 'COMPLETED' };
      },
    },
    async () => {
      await handler(
        { params: { id: 'job-own' }, tenant: { id: 'tenant-a' } },
        response
      );
    }
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { id: 'job-own', status: 'COMPLETED' });
  assert.equal(approveCalls, 1);
});

test('PATCH /suggestions/:id rejects cross-tenant suggestion updates', async () => {
  const handler = getRouteHandler('/suggestions/:id', 'patch');
  const response = createResponse();
  let updateCalls = 0;

  await withServiceMocks(
    {
      listSuggestions: async () => [{ id: 'suggestion-own' }],
      updateSuggestion: async () => {
        updateCalls += 1;
        return { id: 'suggestion-foreign', status: 'APPLIED' };
      },
    },
    async () => {
      await handler(
        {
          params: { id: 'suggestion-foreign' },
          tenant: { id: 'tenant-a' },
          body: { status: 'APPLIED', resolution: 'ok' },
        },
        response
      );
    }
  );

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.payload, { error: 'Suggestion nicht gefunden' });
  assert.equal(updateCalls, 0);
});

test('PATCH /suggestions/:id allows same-tenant suggestion updates', async () => {
  const handler = getRouteHandler('/suggestions/:id', 'patch');
  const response = createResponse();
  let capturedArgs: unknown[] = [];

  await withServiceMocks(
    {
      listSuggestions: async () => [{ id: 'suggestion-own' }],
      updateSuggestion: async (...args: unknown[]) => {
        capturedArgs = args;
        return { id: 'suggestion-own', status: 'APPLIED' };
      },
    },
    async () => {
      await handler(
        {
          params: { id: 'suggestion-own' },
          tenant: { id: 'tenant-a' },
          body: { status: 'APPLIED', resolution: 'done' },
        },
        response
      );
    }
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { id: 'suggestion-own', status: 'APPLIED' });
  assert.deepEqual(capturedArgs, [
    'suggestion-own',
    { status: 'APPLIED', resolution: 'done' },
  ]);
});
