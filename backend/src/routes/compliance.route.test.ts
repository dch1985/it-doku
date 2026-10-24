import test from 'node:test';
import assert from 'node:assert/strict';
import complianceRouter, { parseOptionalNullableStringField } from './compliance.js';
import { complianceService } from '../services/compliance.service.js';

function createMockResponse() {
  const response: {
    statusCode: number;
    payload: unknown;
    status: (code: number) => any;
    json: (payload: unknown) => any;
  } = {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
      return response;
    },
  };

  return response;
}

test('parseOptionalNullableStringField returns undefined when field is omitted', () => {
  const parsed = parseOptionalNullableStringField(
    { status: 'APPROVED' } as Record<string, unknown>,
    'comments',
  );

  assert.equal(parsed, undefined);
});

test('parseOptionalNullableStringField returns null when field is explicitly null', () => {
  const parsed = parseOptionalNullableStringField(
    { comments: null } as Record<string, unknown>,
    'comments',
  );

  assert.equal(parsed, null);
});

test('parseOptionalNullableStringField keeps explicit comment strings', () => {
  const parsed = parseOptionalNullableStringField(
    { comments: 'Looks good' } as Record<string, unknown>,
    'comments',
  );

  assert.equal(parsed, 'Looks good');
});

test('parseOptionalNullableStringField rejects non-string values', () => {
  assert.throws(() =>
    parseOptionalNullableStringField(
      { comments: { note: 'invalid' } } as Record<string, unknown>,
      'comments',
    ),
  );
});

test('PATCH /reviews handler keeps comments unchanged when comments field is omitted', async () => {
  const layer = (complianceRouter as any).stack.find(
    (stackLayer: any) => stackLayer.route?.path === '/reviews/:id' && stackLayer.route?.methods?.patch,
  );
  assert.ok(layer, 'PATCH /reviews/:id route should exist');

  const routeHandler = layer.route.stack[0].handle;
  const originalUpdateReviewRequest = complianceService.updateReviewRequest;
  let capturedPayload: any = null;

  try {
    (complianceService as any).updateReviewRequest = async (_id: string, payload: unknown) => {
      capturedPayload = payload;
      return { id: 'review-1', ...payload };
    };

    const req = {
      params: { id: 'review-1' },
      body: { status: 'approved' },
      tenant: { id: 'tenant-1' },
    } as any;
    const res = createMockResponse();

    await routeHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedPayload.comments, undefined);
    assert.equal(capturedPayload.status, 'APPROVED');
  } finally {
    (complianceService as any).updateReviewRequest = originalUpdateReviewRequest;
  }
});
