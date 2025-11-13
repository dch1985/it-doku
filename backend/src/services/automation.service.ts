import { prisma } from '../lib/prisma.js';
import { automationQueue } from '../lib/automation.queue.js';
import { generateDocumentDraft } from '../lib/openai.client.js';

const AUTO_RUN_ON_PUBLISH = process.env.AUTOMATION_QUEUE_AUTORUN === 'true';
const RUN_IMMEDIATELY_ON_CREATE = process.env.AUTOMATION_RUN_IMMEDIATE === 'true';

interface GenerationContext {
  jobId: string;
  intent: string;
  tenantId?: string | null;
  payload: Record<string, unknown> | null;
  connector?: {
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown> | null;
  } | null;
  document?: {
    id: string;
    title: string | null;
  } | null;
}

function parsePossibleJson(value: string | Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(value as string);
  } catch (error) {
    console.warn('[AutomationService] Failed to parse JSON payload/config', error);
    return { raw: value } as Record<string, unknown>;
  }
}

function buildQualityFindings(draft: string): Array<{ category: string; severity: string; message: string; location?: string | null }> {
  const findings: Array<{ category: string; severity: string; message: string; location?: string | null }> = [];

  if (draft.includes('TODO')) {
    findings.push({
      category: 'STRUCTURE',
      severity: 'WARNING',
      message: 'Es wurden TODO-Platzhalter gefunden. Bitte konkretisieren und entfernen.',
      location: 'body',
    });
  }

  if (!draft.match(/## (Kontext|Context)/i)) {
    findings.push({
      category: 'COMPLIANCE',
      severity: 'INFO',
      message: 'Kein Kontextabschnitt gefunden. Ergänze Quellen/Referenzen für Audit-Trail.',
    });
  }

  if (!draft.toLowerCase().includes('review')) {
    findings.push({
      category: 'TERMINOLOGY',
      severity: 'INFO',
      message: 'Formuliere einen Abschnitt zum Review-/Freigabeprozess.',
    });
  }

  return findings;
}

async function buildGenerationContext(jobId: string): Promise<GenerationContext> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`GenerationJob ${jobId} wurde nicht gefunden`);
  }

  const connector = job.sourceConnectorId
    ? await prisma.sourceConnector.findUnique({
        where: { id: job.sourceConnectorId },
      })
    : null;

  const document = job.documentId
    ? await prisma.document.findUnique({
        where: { id: job.documentId },
        select: {
          id: true,
          title: true,
        },
      })
    : null;

  return {
    jobId,
    intent: job.intent,
    tenantId: job.tenantId,
    payload: parsePossibleJson(job.payload as string | null | undefined),
    connector: connector
      ? {
          id: connector.id,
          name: connector.name,
          type: connector.type,
          config: parsePossibleJson(connector.config as string | null | undefined),
        }
      : null,
    document: document ? { id: document.id, title: document.title } : null,
  };
}

export interface ConnectorPayload {
  name: string;
  type: string;
  config?: Record<string, unknown> | string;
}

export interface JobPayload {
  intent?: string;
  documentId?: string;
  connectorId?: string;
  payload?: Record<string, unknown> | string | null;
  title?: string;
}

export interface SuggestionUpdateInput {
  status: string;
  resolution?: string;
}

export const automationService = {
  async listConnectors(tenantId?: string | null) {
    return prisma.sourceConnector.findMany({
      where: {
        OR: [
          { tenantId: tenantId ?? undefined },
          { tenantId: null },
        ],
      },
      orderBy: [
        { isActive: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  },

  async getConnector(id: string) {
    return prisma.sourceConnector.findUnique({ where: { id } });
  },

  async createConnector(tenantId: string | null | undefined, payload: ConnectorPayload) {
    return prisma.sourceConnector.create({
      data: {
        name: payload.name.trim(),
        type: payload.type.trim().toUpperCase(),
        config: typeof payload.config === 'string' ? payload.config : JSON.stringify(payload.config ?? {}),
        tenantId: tenantId ?? null,
      },
    });
  },

  async updateConnector(id: string, data: { isActive?: boolean }) {
    return prisma.sourceConnector.update({
      where: { id },
      data,
    });
  },

  async listJobs(tenantId?: string | null) {
    return prisma.generationJob.findMany({
      where: {
        tenantId: tenantId ?? undefined,
      },
      select: {
        id: true,
        status: true,
        intent: true,
        payload: true,
        resultDraft: true,
        documentId: true,
        sourceConnectorId: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        error: true,
        suggestions: {
          select: {
            id: true,
            title: true,
            status: true,
            summary: true,
            diffPreview: true,
            updatedAt: true,
          },
        },
        qualityFindings: {
          select: {
            id: true,
            category: true,
            severity: true,
            message: true,
            location: true,
            resolvedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createJob(tenantId: string | null | undefined, userId: string | null | undefined, input: JobPayload) {
    const job = await prisma.generationJob.create({
      data: {
        intent: input.intent?.toUpperCase() ?? 'CREATE',
        payload: typeof input.payload === 'string' ? input.payload : input.payload ? JSON.stringify(input.payload) : null,
        documentId: input.documentId ?? null,
        sourceConnectorId: input.connectorId ?? null,
        tenantId: tenantId ?? null,
      },
    });

    if (input.title || input.documentId) {
      await prisma.updateSuggestion.create({
        data: {
          generationJobId: job.id,
          title: input.title ?? 'Automatische Aktualisierung',
          summary: 'KI-Entwurf wurde erstellt. Bitte prüfen.',
          status: 'OPEN',
          documentId: input.documentId ?? null,
        },
      }).catch((error) => {
        console.warn('[AutomationService] Could not create suggestion', error);
      });
    }

    if (AUTO_RUN_ON_PUBLISH) {
      await automationQueue.publish({ jobId: job.id, tenantId: tenantId ?? null });
    } else if (RUN_IMMEDIATELY_ON_CREATE) {
      await automationService.processJob(job.id);
    }

    return job;
  },

  async getJobWithDetails(id: string) {
    return prisma.generationJob.findUnique({
      where: { id },
      include: {
        suggestions: true,
        qualityFindings: true,
      },
    });
  },

  async approveJob(id: string) {
    return prisma.generationJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  },

  async retryJob(id: string) {
    const job = await prisma.generationJob.findUnique({ where: { id } });
    if (!job) {
      throw new Error('GenerationJob nicht gefunden');
    }

    if (job.status === 'RUNNING') {
      throw new Error('Job wird aktuell verarbeitet und kann nicht neu gestartet werden');
    }

    await prisma.$transaction([
      prisma.generationJob.update({
        where: { id },
        data: {
          status: 'PENDING',
          resultDraft: null,
          completedAt: null,
          error: null,
          updatedAt: new Date(),
        },
      }),
      prisma.qualityFinding.deleteMany({
        where: { generationJobId: id },
      }),
    ]);

    if (AUTO_RUN_ON_PUBLISH) {
      await automationQueue.publish({ jobId: id, tenantId: job.tenantId ?? null });
    } else if (RUN_IMMEDIATELY_ON_CREATE) {
      await automationService.processJob(id);
    }

    return this.getJobWithDetails(id);
  },

  async cancelJob(id: string) {
    const job = await prisma.generationJob.findUnique({ where: { id } });
    if (!job) {
      throw new Error('GenerationJob nicht gefunden');
    }

    if (!['PENDING', 'RUNNING'].includes(job.status)) {
      throw new Error('Job kann in seinem aktuellen Status nicht abgebrochen werden');
    }

    return prisma.generationJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  },

  async listSuggestions(tenantId?: string | null) {
    return prisma.updateSuggestion.findMany({
      where: tenantId
        ? {
            generationJob: {
              tenantId,
            },
          }
        : {},
      orderBy: { updatedAt: 'desc' },
    });
  },

  async updateSuggestion(id: string, changes: SuggestionUpdateInput) {
    return prisma.updateSuggestion.update({
      where: { id },
      data: {
        status: changes.status?.toUpperCase() ?? 'OPEN',
        metadata: changes.resolution ? JSON.stringify({ resolution: changes.resolution }) : undefined,
        resolvedAt: ['APPLIED', 'DISMISSED'].includes((changes.status ?? '').toUpperCase()) ? new Date() : null,
      },
    });
  },

  async processJob(jobId: string) {
    const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`GenerationJob ${jobId} nicht gefunden`);
    }

    if (job.status === 'COMPLETED') {
      return this.getJobWithDetails(jobId);
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        error: null,
      },
    });

    try {
      const context = await buildGenerationContext(jobId);
      const draft = await generateDocumentDraft({
        intent: context.intent,
        documentTitle: context.document?.title ?? null,
        connectorName: context.connector?.name ?? null,
        payload: context.payload,
      });

      const findings = buildQualityFindings(draft);

      const operations = [
        prisma.generationJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            resultDraft: draft,
            completedAt: new Date(),
            error: null,
          },
        }),
        prisma.qualityFinding.deleteMany({
          where: { generationJobId: jobId },
        }),
      ];

      if (findings.length > 0) {
        operations.push(
          prisma.qualityFinding.createMany({
            data: findings.map((finding) => ({
              ...finding,
              generationJobId: jobId,
              documentId: context.document?.id ?? null,
            })),
          })
        );
      }

      await prisma.$transaction(operations);

      return this.getJobWithDetails(jobId);
    } catch (error: any) {
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error?.message ?? 'Unbekannter Fehler in der Generierung',
        },
      });
      throw error;
    }
  },
};

if (AUTO_RUN_ON_PUBLISH) {
  automationQueue.subscribe(async ({ jobId }) => {
    try {
      await automationService.processJob(jobId);
    } catch (error) {
      console.error('[AutomationService] Failed to process queued job', jobId, error);
    }
  });
}
