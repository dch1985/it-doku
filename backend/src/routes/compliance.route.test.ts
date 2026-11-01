import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import router from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

type RouteLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (req: Request, res: Response) => Promise<void> | void }>;
  };
};

function getRouteHandler(path: string, method: 'patch' | 'post' | 'get') {
  const layers = (router as unknown as { stack: RouteLayer[] }).stack;
  const layer = layers.find((entry) => entry.route?.path === path && entry.route.methods[method]);
  if (!layer?.route?.stack[0]?.handle) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack[0].handle;
}

function createMockResponse() {
  const state: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: undefined,
  };

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      state.body = payload;
      return response;
    },
    send(payload?: unknown) {
      state.body = payload;
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

test('PATCH /reviews/:id keeps comments unchanged when field is omitted', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const original = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | undefined;

  complianceService.updateReviewRequest = (async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: 'review-1', status: payload.status ?? 'PENDING' };
  }) as typeof complianceService.updateReviewRequest;

  const { response, state } = createMockResponse();
  const request = {
    params: { id: 'review-1' },
    body: { status: 'approved' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  try {
    await handler(request, response);
    assert.equal(state.statusCode, 200);
    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, undefined);
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /reviews/:id forwards explicit null comments for intentional clears', async () => {
  const handler = getRouteHandler('/reviews/:id', 'patch');
  const original = complianceService.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | undefined;

  complianceService.updateReviewRequest = (async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: 'review-1', status: payload.status ?? 'PENDING', comments: payload.comments ?? null };
  }) as typeof complianceService.updateReviewRequest;

  const { response, state } = createMockResponse();
  const request = {
    params: { id: 'review-1' },
    body: { status: 'APPROVED', comments: null },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  try {
    await handler(request, response);
    assert.equal(state.statusCode, 200);
    assert.equal(capturedPayload?.comments, null);
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /quality/findings/:id does not coerce omitted resolution to null', async () => {
  const handler = getRouteHandler('/quality/findings/:id', 'patch');
  const original = complianceService.updateQualityFinding;
  let capturedPayload: Record<string, unknown> | undefined;

  complianceService.updateQualityFinding = (async (_id: string, payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { id: 'finding-1', ...payload };
  }) as typeof complianceService.updateQualityFinding;

  const { response, state } = createMockResponse();
  const request = {
    params: { id: 'finding-1' },
    body: {},
  } as unknown as Request;

  try {
    await handler(request, response);
    assert.equal(state.statusCode, 200);
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload ?? {}, 'resolution'), true);
    assert.equal(capturedPayload?.resolution, undefined);
  } finally {
    complianceService.updateQualityFinding = original;
  }
});
