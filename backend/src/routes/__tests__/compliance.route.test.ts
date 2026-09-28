import assert from 'node:assert/strict';
import test from 'node:test';
import type { RequestHandler, Response } from 'express';
import router from '../compliance.js';
import { complianceService } from '../../services/compliance.service.js';

type MutableComplianceService = typeof complianceService & {
  updateReviewRequest: typeof complianceService.updateReviewRequest;
  updateQualityFinding: typeof complianceService.updateQualityFinding;
};

function createMockResponse(): Response {
  return {
    status() {
      return this;
    },
    json() {
      return this;
    },
  } as unknown as Response;
}

function getPatchHandler(path: string): RequestHandler {
  const layer = (router as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.patch,
  );

  if (!layer?.route?.stack?.[0]?.handle) {
    throw new Error(`PATCH handler for path ${path} was not found`);
  }

  return layer.route.stack[0].handle as RequestHandler;
}

test('PATCH /reviews/:id keeps comments undefined when omitted', async () => {
  const service = complianceService as MutableComplianceService;
  const originalUpdateReviewRequest = service.updateReviewRequest;
  let capturedPayload: Record<string, unknown> | undefined;

  service.updateReviewRequest = (async (_id, payload) => {
    capturedPayload = payload as Record<string, unknown>;
    return {} as any;
  }) as MutableComplianceService['updateReviewRequest'];

  try {
    const handler = getPatchHandler('/reviews/:id');
    await handler(
      {
        body: { status: 'APPROVED' },
        params: { id: 'review-1' },
        tenant: { id: 'tenant-1' },
      } as any,
      createMockResponse(),
      () => undefined,
    );

    assert.ok(capturedPayload, 'Service payload should be captured');
    assert.equal(capturedPayload?.status, 'APPROVED');
    assert.equal(capturedPayload?.comments, undefined);
    assert.equal(capturedPayload?.tenantId, 'tenant-1');
  } finally {
    service.updateReviewRequest = originalUpdateReviewRequest;
  }
});

test('PATCH /quality/findings/:id keeps resolution undefined when omitted', async () => {
  const service = complianceService as MutableComplianceService;
  const originalUpdateQualityFinding = service.updateQualityFinding;
  let capturedPayload: Record<string, unknown> | undefined;

  service.updateQualityFinding = (async (_id, payload) => {
    capturedPayload = payload as Record<string, unknown>;
    return {} as any;
  }) as MutableComplianceService['updateQualityFinding'];

  try {
    const handler = getPatchHandler('/quality/findings/:id');
    await handler(
      {
        body: { action: 'RESOLVE' },
        params: { id: 'finding-1' },
      } as any,
      createMockResponse(),
      () => undefined,
    );

    assert.ok(capturedPayload, 'Service payload should be captured');
    assert.equal(capturedPayload?.action, 'RESOLVE');
    assert.equal(capturedPayload?.resolution, undefined);
  } finally {
    service.updateQualityFinding = originalUpdateQualityFinding;
  }
});
