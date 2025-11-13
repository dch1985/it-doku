import { prisma } from '../lib/prisma.js';

export interface TemplateSchemaPayload {
  name: string;
  description?: string;
  format?: string;
  schema: string | Record<string, unknown>;
  isGlobal?: boolean;
  tenantId?: string | null;
  actorRole?: string | null;
}

export interface AnnotationPayload {
  documentId: string;
  key: string;
  value: string | Record<string, unknown>;
  location?: string;
  tenantId?: string | null;
}

export interface TraceLinkPayload {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship?: string;
  metadata?: Record<string, unknown>;
  tenantId?: string | null;
  sourceDocumentId?: string | null;
  targetDocumentId?: string | null;
}

function stripHtml(content: string | null | undefined): string {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const complianceService = {
  listTemplateSchemas(tenantId?: string | null) {
    return prisma.templateSchema.findMany({
      where: {
        OR: [
          { tenantId: tenantId ?? undefined },
          { isGlobal: true },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  createTemplateSchema(payload: TemplateSchemaPayload) {
    const schemaValue = typeof payload.schema === 'string' ? payload.schema : JSON.stringify(payload.schema);
    const canBeGlobal = Boolean(payload.isGlobal) && (!payload.tenantId || payload.actorRole === 'ADMIN');

    return prisma.templateSchema.create({
      data: {
        name: payload.name.trim(),
        description: payload.description ? payload.description.trim() : null,
        format: payload.format ? payload.format.toUpperCase() : 'MARKDOWN',
        schema: schemaValue,
        isGlobal: canBeGlobal,
        tenantId: payload.tenantId ?? null,
      },
    });
  },

  listAnnotations(tenantId?: string | null, documentId?: string) {
    return prisma.annotation.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(documentId ? { documentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  createAnnotation(payload: AnnotationPayload) {
    const value = typeof payload.value === 'string' ? payload.value : JSON.stringify(payload.value);

    return prisma.annotation.create({
      data: {
        documentId: payload.documentId,
        key: payload.key.toUpperCase(),
        value,
        location: payload.location ? payload.location : null,
        tenantId: payload.tenantId ?? null,
      },
    });
  },

  listTraceLinks(tenantId?: string | null, documentId?: string) {
    return prisma.traceLink.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(documentId
          ? {
              OR: [
                { sourceDocumentId: documentId },
                { targetDocumentId: documentId },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  createTraceLink(payload: TraceLinkPayload) {
    return prisma.traceLink.create({
      data: {
        sourceType: payload.sourceType.toUpperCase(),
        sourceId: payload.sourceId,
        targetType: payload.targetType.toUpperCase(),
        targetId: payload.targetId,
        relationship: payload.relationship ? payload.relationship.toUpperCase() : 'RELATES_TO',
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        tenantId: payload.tenantId ?? null,
        sourceDocumentId: payload.sourceDocumentId ?? null,
        targetDocumentId: payload.targetDocumentId ?? null,
      },
    });
  },

  listQualityFindings(documentId?: string) {
    return prisma.qualityFinding.findMany({
      where: {
        ...(documentId ? { documentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  updateQualityFinding(id: string, resolution?: string) {
    return prisma.qualityFinding.update({
      where: { id },
      data: {
        resolution: resolution ?? null,
        resolvedAt: resolution ? new Date() : null,
      },
    });
  },

  async runQualityChecks(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        content: true,
        title: true,
        category: true,
      },
    });

    if (!document) {
      throw new Error('Dokument nicht gefunden');
    }

    const text = stripHtml(document.content);
    const findings: Array<{ category: string; severity: string; message: string; location?: string | null }> = [];

    if (/lorem ipsum/i.test(text) || /dummy text/i.test(text)) {
      findings.push({
        category: 'STYLE',
        severity: 'WARNING',
        message: 'Platzhaltertext (Lorem Ipsum) gefunden – ersetze durch echten Inhalt.',
      });
    }

    if (/password:\s*[a-z0-9]/i.test(text)) {
      findings.push({
        category: 'COMPLIANCE',
        severity: 'ERROR',
        message: 'Klarnennungen von Passwörtern erkannt. Bitte entfernen oder in Secrets Manager auslagern.',
      });
    }

    if (!/review/i.test(text)) {
      findings.push({
        category: 'STRUCTURE',
        severity: 'INFO',
        message: 'Hinweis: Füge einen Abschnitt zum Review-/Freigabeprozess hinzu.',
      });
    }

    if (!/owner|verantwortlich/i.test(text)) {
      findings.push({
        category: 'GOVERNANCE',
        severity: 'INFO',
        message: 'Kein Verantwortlicher genannt – dokumentiere Owner/Verantwortliche Stelle.',
      });
    }

    await prisma.qualityFinding.deleteMany({ where: { documentId, generationJobId: null } });

    if (findings.length > 0) {
      await prisma.qualityFinding.createMany({
        data: findings.map((finding) => ({
          ...finding,
          documentId,
          generationJobId: null,
        })),
      });
    }

    return findings;
  },
};
