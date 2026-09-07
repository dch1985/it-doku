import assert from 'node:assert/strict';
import test from 'node:test';

const { default: complianceRouter } = await import('./compliance.js');
const { complianceService } = await import('../services/compliance.service.js');

type RouteHandler = (req: any, res: any) => Promise<void>;

function getReviewPatchHandler(): RouteHandler {
  const layer = (complianceRouter as any).stack.find(
    (entry: any) => entry.route?.path === '/reviews/:id' && entry.route?.methods?.patch,
  );

  if (!layer) {
    throw new Error('PATCH /reviews/:id route not found');
  }

  return layer.route.stack[0].handle as RouteHandler;
}

function createMockResponse() {
  const response: any = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  return response;
}

async function invokeReviewPatch(body: Record<string, unknown>) {
  const handler = getReviewPatchHandler();
  const req: any = {
    body,
    params: { id: 'review-1' },
    tenant: { id: 'tenant-1' },
  };
  const res = createMockResponse();

  await handler(req, res);
  return res;
}

test('PATCH /api/compliance/reviews/:id keeps comments untouched on status-only updates', async () => {
  const original = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id, payload) => {
    capturedPayload = payload;
    return {
      id: 'review-1',
      documentId: 'doc-1',
      status: 'APPROVED',
      comments: 'bestehender Kommentar',
    } as any;
  };

  try {
    const response = await invokeReviewPatch({ status: 'APPROVED' });

    assert.equal(response.statusCode, 200);
    assert.equal((capturedPayload as { comments?: string | null }).comments, undefined);
    assert.equal((capturedPayload as { status?: string }).status, 'APPROVED');
  } finally {
    complianceService.updateReviewRequest = original;
  }
});

test('PATCH /api/compliance/reviews/:id forwards explicit comments null to clear note', async () => {
  const original = complianceService.updateReviewRequest;
  let capturedPayload: unknown;

  complianceService.updateReviewRequest = async (_id, payload) => {
    capturedPayload = payload;
    return {
      id: 'review-1',
      documentId: 'doc-1',
      status: 'APPROVED',
      comments: null,
    } as any;
  };

  try {
    const response = await invokeReviewPatch({ status: 'APPROVED', comments: null });

    assert.equal(response.statusCode, 200);
    assert.equal(Object.prototype.hasOwnProperty.call(capturedPayload as object, 'comments'), true);
    assert.equal((capturedPayload as { comments?: string | null }).comments, null);
    assert.equal((capturedPayload as { status?: string }).status, 'APPROVED');
  } finally {
    complianceService.updateReviewRequest = original;
  }
});
