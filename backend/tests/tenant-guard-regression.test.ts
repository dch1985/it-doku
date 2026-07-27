import assert from 'node:assert/strict';
import automationRouter from '../src/routes/automation.js';
import { automationService } from '../src/services/automation.service.js';
import { complianceService } from '../src/services/compliance.service.js';
import { prisma } from '../src/lib/prisma.js';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

function getRouteHandler(path: string, method: 'post' | 'patch') {
  const layer = (automationRouter as any).stack.find(
    (entry: any) => entry.route?.path === path && entry.route.methods?.[method],
  );

  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[0].handle as (req: any, res: MockResponse) => Promise<void>;
}

async function run() {
  const prismaAny = prisma as any;
  const originalPrisma = {
    document: prismaAny.document,
    qualityFinding: prismaAny.qualityFinding,
  };

  const originalAutomation = {
    getJobWithDetails: automationService.getJobWithDetails,
    approveJob: automationService.approveJob,
    getSuggestionWithTenant: automationService.getSuggestionWithTenant,
    updateSuggestion: automationService.updateSuggestion,
  };

  try {
    let qualityWhere: unknown;

    prismaAny.document = {
      findMany: async (args: any) => {
        assert.equal(args.where.OR[0].tenantId, 'tenant-a');
        return [{ id: 'doc-a' }];
      },
      findUnique: async () => ({
        id: 'doc-b',
        tenantId: 'tenant-b',
        content: 'Demo content',
        title: 'Doc B',
        category: 'GUIDE',
      }),
    };

    prismaAny.qualityFinding = {
      findMany: async (args: any) => {
        qualityWhere = args.where;
        return [{ id: 'finding-a' }];
      },
      findUnique: async () => ({ id: 'finding-b', documentId: 'doc-b' }),
      update: async () => {
        throw new Error('update should not be called for unauthorized finding');
      },
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
    };

    const findings = await complianceService.listQualityFindings('tenant-a');
    assert.deepEqual(qualityWhere, { documentId: { in: ['doc-a'] } });
    assert.equal(findings.length, 1);

    await assert.rejects(
      () => complianceService.updateQualityFinding('finding-b', { action: 'RESOLVE' }, 'tenant-a'),
      (error: any) => error?.statusCode === 403,
    );

    await assert.rejects(
      () => complianceService.runQualityChecks('doc-b', 'tenant-a'),
      (error: any) => error?.statusCode === 403,
    );

    const approveHandler = getRouteHandler('/jobs/:id/approve', 'post');
    const suggestionHandler = getRouteHandler('/suggestions/:id', 'patch');

    let approveCalled = 0;
    automationService.getJobWithDetails = async () => ({ id: 'job-1', tenantId: 'tenant-b' } as any);
    automationService.approveJob = async () => {
      approveCalled += 1;
      return { id: 'job-1', status: 'COMPLETED' } as any;
    };

    const approveResponse = createMockResponse();
    await approveHandler(
      {
        params: { id: 'job-1' },
        tenant: { id: 'tenant-a' },
      },
      approveResponse,
    );
    assert.equal(approveResponse.statusCode, 404);
    assert.equal(approveCalled, 0);

    let suggestionUpdateCalled = 0;
    automationService.getSuggestionWithTenant = async () => ({
      id: 'suggestion-1',
      generationJob: { tenantId: 'tenant-b' },
    } as any);
    automationService.updateSuggestion = async () => {
      suggestionUpdateCalled += 1;
      return { id: 'suggestion-1', status: 'APPLIED' } as any;
    };

    const suggestionResponse = createMockResponse();
    await suggestionHandler(
      {
        params: { id: 'suggestion-1' },
        body: { status: 'APPLIED' },
        tenant: { id: 'tenant-a' },
      },
      suggestionResponse,
    );
    assert.equal(suggestionResponse.statusCode, 404);
    assert.equal(suggestionUpdateCalled, 0);

    console.log('PASS: tenant guard regression test');
  } finally {
    prismaAny.document = originalPrisma.document;
    prismaAny.qualityFinding = originalPrisma.qualityFinding;

    automationService.getJobWithDetails = originalAutomation.getJobWithDetails;
    automationService.approveJob = originalAutomation.approveJob;
    automationService.getSuggestionWithTenant = originalAutomation.getSuggestionWithTenant;
    automationService.updateSuggestion = originalAutomation.updateSuggestion;
  }
}

run().catch((error) => {
  console.error('FAIL: tenant guard regression test');
  console.error(error);
  process.exit(1);
});
