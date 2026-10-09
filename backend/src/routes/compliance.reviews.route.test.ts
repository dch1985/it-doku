import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type RouteHandler = (req: any, res: any) => Promise<void>;

const originalListReviewRequests = complianceService.listReviewRequests;
const originalUpdateReviewRequest = complianceService.updateReviewRequest;

afterEach(() => {
  complianceService.listReviewRequests = originalListReviewRequests;
  complianceService.updateReviewRequest = originalUpdateReviewRequest;
});

function getRouteHandler(method: 'get' | 'patch', path: string): RouteHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry?.route?.path === path && entry?.route?.methods?.[method],
  );

  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} route to exist`);
  return layer.route.stack[layer.route.stack.length - 1].handle as RouteHandler;
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
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

test('PATCH /reviews/:id does not clear comments when the field is omitted', async () => {
  const patchHandler = getRouteHandler('patch', '/reviews/:id');
  let capturedPayload: any = null;

  complianceService.updateReviewRequest = async (_id: string, payload: any) => {
    capturedPayload = payload;
    return { id: 'review-1', status: payload.status };
  };

  const req: any = {
    params: { id: 'review-1' },
    body: { status: 'approved' },
    user: { id: 'reviewer-1' },
    tenant: { id: 'tenant-1' },
    tenantMember: { role: 'MEMBER' },
  };
  const res = createMockResponse();

  await patchHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload.status, 'APPROVED');
  assert.equal(capturedPayload.actorId, 'reviewer-1');
  assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload, 'comments'), false);
});

test('GET /reviews rejects requests from non-members of the selected tenant', async () => {
  const getHandler = getRouteHandler('get', '/reviews');
  let listCalled = false;

  complianceService.listReviewRequests = async () => {
    listCalled = true;
    return [];
  };

  const req: any = {
    query: {},
    tenant: { id: 'tenant-1' },
    tenantMember: undefined,
  };
  const res = createMockResponse();

  await getHandler(req, res);

  assert.equal(listCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: 'Failed to load review requests',
    message: 'Tenant membership required',
  });
});
