import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { prisma } from '../../lib/prisma.js';
import { automationService } from '../../services/automation.service.js';

process.env.DEV_AUTH_ENABLED = 'true';
process.env.NODE_ENV = 'development';

type JsonObject = Record<string, unknown>;
type JobSummary = { id: string; tenantId: string | null };
type SuggestionSummary = { id: string; generationJob: { tenantId: string | null } | null };

const originalPrismaMethods = {
  userFindFirst: prisma.user.findFirst,
  userCreate: prisma.user.create,
  tenantFindFirst: prisma.tenant.findFirst,
  tenantMemberFindUnique: prisma.tenantMember.findUnique,
};

const originalAutomationMethods = {
  getJobWithDetails: automationService.getJobWithDetails,
  approveJob: automationService.approveJob,
  getSuggestion: automationService.getSuggestion,
  updateSuggestion: automationService.updateSuggestion,
};

let server: Server;
let baseUrl = '';
let automationRouter: express.Router;

function setupAuthAndTenantStubs() {
  prisma.user.findFirst = async () =>
    ({
      id: 'user-a',
      email: 'demo@it-doku.local',
      name: 'Demo User',
      role: 'ADMIN',
    }) as any;

  prisma.user.create = async () =>
    ({
      id: 'user-a',
      email: 'demo@it-doku.local',
      name: 'Demo User',
      role: 'ADMIN',
    }) as any;

  prisma.tenant.findFirst = async () =>
    ({
      id: 'tenant-a',
      name: 'Tenant A',
      slug: 'tenant-a',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PRO',
      isActive: true,
    }) as any;

  prisma.tenantMember.findUnique = async () => ({ role: 'MEMBER' } as any);
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': 'tenant-a',
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json()) as JsonObject;
  return { response, body };
}

before(async () => {
  setupAuthAndTenantStubs();
  ({ default: automationRouter } = await import('../automation.js'));

  const app = express();
  app.use(express.json());
  app.use('/api/automation', automationRouter);

  server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  prisma.user.findFirst = originalPrismaMethods.userFindFirst;
  prisma.user.create = originalPrismaMethods.userCreate;
  prisma.tenant.findFirst = originalPrismaMethods.tenantFindFirst;
  prisma.tenantMember.findUnique = originalPrismaMethods.tenantMemberFindUnique;

  automationService.getJobWithDetails = originalAutomationMethods.getJobWithDetails;
  automationService.approveJob = originalAutomationMethods.approveJob;
  automationService.getSuggestion = originalAutomationMethods.getSuggestion;
  automationService.updateSuggestion = originalAutomationMethods.updateSuggestion;
});

test('POST /jobs/:id/approve blocks cross-tenant mutations', async () => {
  let approveCalled = false;

  automationService.getJobWithDetails = async (id: string) =>
    ({
      id,
      tenantId: 'tenant-b',
    }) as JobSummary as any;

  automationService.approveJob = async () => {
    approveCalled = true;
    return {} as any;
  };

  const { response, body } = await requestJson('/api/automation/jobs/job-b/approve', {
    method: 'POST',
  });

  assert.equal(response.status, 404);
  assert.equal(approveCalled, false);
  assert.equal(body.error, 'Job nicht gefunden');
});

test('POST /jobs/:id/approve allows same-tenant mutations', async () => {
  let approveCalled = false;

  automationService.getJobWithDetails = async (id: string) =>
    ({
      id,
      tenantId: 'tenant-a',
    }) as JobSummary as any;

  automationService.approveJob = async (id: string) => {
    approveCalled = true;
    return { id, status: 'COMPLETED', tenantId: 'tenant-a' } as any;
  };

  const { response, body } = await requestJson('/api/automation/jobs/job-a/approve', {
    method: 'POST',
  });

  assert.equal(response.status, 200);
  assert.equal(approveCalled, true);
  assert.equal(body.status, 'COMPLETED');
});

test('PATCH /suggestions/:id blocks cross-tenant mutations', async () => {
  let updateCalled = false;

  automationService.getSuggestion = async (id: string) =>
    ({
      id,
      generationJob: { tenantId: 'tenant-b' },
    }) as SuggestionSummary as any;

  automationService.updateSuggestion = async () => {
    updateCalled = true;
    return {} as any;
  };

  const { response, body } = await requestJson('/api/automation/suggestions/suggestion-b', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPLIED' }),
  });

  assert.equal(response.status, 404);
  assert.equal(updateCalled, false);
  assert.equal(body.error, 'Suggestion nicht gefunden');
});

test('PATCH /suggestions/:id allows same-tenant mutations', async () => {
  let updateCalled = false;

  automationService.getSuggestion = async (id: string) =>
    ({
      id,
      generationJob: { tenantId: 'tenant-a' },
    }) as SuggestionSummary as any;

  automationService.updateSuggestion = async (id: string, changes: { status: string }) => {
    updateCalled = true;
    return { id, status: changes.status.toUpperCase() } as any;
  };

  const { response, body } = await requestJson('/api/automation/suggestions/suggestion-a', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'applied' }),
  });

  assert.equal(response.status, 200);
  assert.equal(updateCalled, true);
  assert.equal(body.status, 'APPLIED');
});
