import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

async function startComplianceApp() {
  const { default: complianceRouter } = await import('../src/routes/compliance.js');
  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);

  return new Promise<Server>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

test('PATCH /api/compliance/reviews/:id keeps comments untouched when omitted', async () => {
  const { complianceService } = await import('../src/services/compliance.service.js');
  const originalHandler = complianceService.updateReviewRequest;
  let captured: { id: string; payload: unknown } | null = null;

  complianceService.updateReviewRequest = async (id, payload) => {
    captured = { id, payload };
    return {
      id,
      status: payload.status ?? 'PENDING',
      comments: payload.comments ?? 'existing comment',
    } as any;
  };

  const server = await startComplianceApp();
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://localhost:${address.port}/api/compliance/reviews/review-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    assert.equal(response.status, 200);
    assert.ok(captured);
    const payload = captured.payload as { status?: string; comments?: string | null };
    assert.equal(payload.status, 'APPROVED');
    assert.equal(payload.comments, undefined);
  } finally {
    complianceService.updateReviewRequest = originalHandler;
    await stopServer(server);
  }
});

test('PATCH /api/compliance/quality/findings/:id keeps resolution untouched when omitted', async () => {
  const { complianceService } = await import('../src/services/compliance.service.js');
  const originalHandler = complianceService.updateQualityFinding;
  let captured: { id: string; payload: unknown } | null = null;

  complianceService.updateQualityFinding = async (id, payload) => {
    captured = { id, payload };
    return {
      id,
      category: 'COMPLIANCE',
      severity: 'INFO',
      message: 'ok',
    } as any;
  };

  const server = await startComplianceApp();
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://localhost:${address.port}/api/compliance/quality/findings/finding-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REOPEN' }),
    });

    assert.equal(response.status, 200);
    assert.ok(captured);
    const payload = captured.payload as { action?: string; resolution?: string | null };
    assert.equal(payload.action, 'REOPEN');
    assert.equal(payload.resolution, undefined);
  } finally {
    complianceService.updateQualityFinding = originalHandler;
    await stopServer(server);
  }
});
