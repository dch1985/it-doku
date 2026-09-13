import assert from 'node:assert/strict';
import test from 'node:test';

import automationRouter from '../routes/automation.ts';
import complianceRouter from '../routes/compliance.ts';
import { prisma } from '../lib/prisma.ts';
import { ApplicationError } from '../middleware/errorHandler.ts';
import { automationService } from './automation.service.ts';
import { complianceService } from './compliance.service.ts';

type AnyRecord = Record<string, any>;

const prismaAny = prisma as unknown as AnyRecord;

const originalPrismaDelegates = {
  generationJob: prismaAny.generationJob,
  updateSuggestion: prismaAny.updateSuggestion,
  qualityFinding: prismaAny.qualityFinding,
  document: prismaAny.document,
};

const originalServiceMethods = {
  approveJob: automationService.approveJob,
  updateSuggestion: automationService.updateSuggestion,
  updateQualityFinding: complianceService.updateQualityFinding,
};

function restorePrismaDelegates() {
  prismaAny.generationJob = originalPrismaDelegates.generationJob;
  prismaAny.updateSuggestion = originalPrismaDelegates.updateSuggestion;
  prismaAny.qualityFinding = originalPrismaDelegates.qualityFinding;
  prismaAny.document = originalPrismaDelegates.document;
}

function restoreServiceMethods() {
  automationService.approveJob = originalServiceMethods.approveJob;
  automationService.updateSuggestion = originalServiceMethods.updateSuggestion;
  complianceService.updateQualityFinding = originalServiceMethods.updateQualityFinding;
}

function routeHandlerFor(router: AnyRecord, method: string, path: string) {
  const layer = router.stack.find(
    (entry: AnyRecord) => entry.route && entry.route.path === path && entry.route.methods[method],
  );
  if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} was not found`);
  return layer.route.stack[0].handle as Function;
}

test('automationService.approveJob rejects cross-tenant approvals', async () => {
  let updateCalled = false;
  prismaAny.generationJob = {
    findUnique: async ({ where }: AnyRecord) => ({ id: where.id, tenantId: 'tenant-b' }),
    update: async () => {
      updateCalled = true;
      return { id: 'job-1' };
    },
  };

  await assert.rejects(
    automationService.approveJob('job-1', 'tenant-a'),
    (error: any) => error instanceof ApplicationError && error.statusCode === 403,
  );
  assert.equal(updateCalled, false);

  restorePrismaDelegates();
});

test('automationService.updateSuggestion rejects cross-tenant updates', async () => {
  let updateCalled = false;
  prismaAny.updateSuggestion = {
    findUnique: async () => ({ id: 's-1', generationJob: { tenantId: 'tenant-b' } }),
    update: async () => {
      updateCalled = true;
      return { id: 's-1' };
    },
  };

  await assert.rejects(
    automationService.updateSuggestion('s-1', { status: 'APPLIED' }, 'tenant-a'),
    (error: any) => error instanceof ApplicationError && error.statusCode === 403,
  );
  assert.equal(updateCalled, false);

  restorePrismaDelegates();
});

test('complianceService scopes quality finding list by tenant', async () => {
  let capturedWhere: AnyRecord | null = null;
  prismaAny.qualityFinding = {
    findMany: async ({ where }: AnyRecord) => {
      capturedWhere = where;
      return [];
    },
  };

  await complianceService.listQualityFindings('tenant-a', 'doc-1');

  assert.equal(capturedWhere?.document?.tenantId, 'tenant-a');
  assert.equal(capturedWhere?.documentId, 'doc-1');

  restorePrismaDelegates();
});

test('complianceService blocks cross-tenant quality finding updates and no-op payloads', async () => {
  prismaAny.qualityFinding = {
    findUnique: async () => ({ id: 'f-1', document: { tenantId: 'tenant-b' } }),
    update: async () => ({ id: 'f-1' }),
  };

  await assert.rejects(
    complianceService.updateQualityFinding('f-1', { action: 'RESOLVE', resolution: 'done' }, 'tenant-a'),
    (error: any) => error instanceof ApplicationError && error.statusCode === 403,
  );

  prismaAny.qualityFinding.findUnique = async () => ({ id: 'f-2', document: { tenantId: 'tenant-a' } });

  await assert.rejects(
    complianceService.updateQualityFinding('f-2', {}, 'tenant-a'),
    (error: any) => error instanceof ApplicationError && error.statusCode === 400,
  );

  restorePrismaDelegates();
});

test('complianceService.runQualityChecks rejects cross-tenant quality regeneration', async () => {
  let deleteCalled = false;
  prismaAny.document = {
    findUnique: async () => ({
      id: 'doc-1',
      title: 'Top Secret',
      content: '<p>password: abc123</p>',
      category: 'SECURITY',
      tenantId: 'tenant-b',
    }),
  };
  prismaAny.qualityFinding = {
    deleteMany: async () => {
      deleteCalled = true;
      return { count: 0 };
    },
    createMany: async () => ({ count: 0 }),
  };

  await assert.rejects(
    complianceService.runQualityChecks('doc-1', 'tenant-a'),
    (error: any) => error instanceof ApplicationError && error.statusCode === 403,
  );
  assert.equal(deleteCalled, false);

  restorePrismaDelegates();
});

test('compliance quality finding route keeps missing resolution as undefined', async () => {
  let capturedArgs: AnyRecord | null = null;
  complianceService.updateQualityFinding = (async (...args: any[]) => {
    capturedArgs = args;
    return { id: 'f-1' };
  }) as typeof complianceService.updateQualityFinding;

  const handler = routeHandlerFor(complianceRouter as unknown as AnyRecord, 'patch', '/quality/findings/:id');
  const req = {
    body: {},
    params: { id: 'f-1' },
    tenant: { id: 'tenant-a' },
  } as AnyRecord;
  const res = {
    json: () => undefined,
    status: () => res,
  } as AnyRecord;

  await handler(req, res);
  assert.equal(capturedArgs?.[1]?.resolution, undefined);
  assert.equal(capturedArgs?.[2], 'tenant-a');

  restoreServiceMethods();
});

test('automation routes forward tenant id to guarded service methods', async () => {
  let approveTenant: string | null = null;
  let suggestionTenant: string | null = null;

  automationService.approveJob = (async (_id: string, tenantId?: string | null) => {
    approveTenant = tenantId ?? null;
    return { id: 'job-1', status: 'COMPLETED' } as any;
  }) as typeof automationService.approveJob;

  automationService.updateSuggestion = (async (_id: string, _changes: AnyRecord, tenantId?: string | null) => {
    suggestionTenant = tenantId ?? null;
    return { id: 's-1', status: 'APPLIED' } as any;
  }) as typeof automationService.updateSuggestion;

  const approveHandler = routeHandlerFor(automationRouter as unknown as AnyRecord, 'post', '/jobs/:id/approve');
  const suggestHandler = routeHandlerFor(automationRouter as unknown as AnyRecord, 'patch', '/suggestions/:id');

  const approveReq = { params: { id: 'job-1' }, tenant: { id: 'tenant-a' } } as AnyRecord;
  const suggestReq = { params: { id: 's-1' }, body: { status: 'applied' }, tenant: { id: 'tenant-a' } } as AnyRecord;
  const res = {
    json: () => undefined,
    status: () => res,
  } as AnyRecord;

  await approveHandler(approveReq, res);
  await suggestHandler(suggestReq, res);

  assert.equal(approveTenant, 'tenant-a');
  assert.equal(suggestionTenant, 'tenant-a');

  restoreServiceMethods();
});

test('cleanup prisma client', async () => {
  restorePrismaDelegates();
  restoreServiceMethods();
  await prisma.$disconnect();
});
