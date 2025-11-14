import { prisma } from '../lib/prisma.js';
import { ApplicationError } from '../middleware/errorHandler.js';

type KnowledgeNodePayload = {
  content: string;
  type: string;
  documentId?: string | null;
  tags?: string[] | string | null;
  metadata?: Record<string, unknown> | string | null;
  connections?: unknown;
};

type KnowledgeNodeUpdatePayload = {
  content?: string;
  type?: string;
  documentId?: string | null;
  tags?: string[] | string | null;
  metadata?: Record<string, unknown> | string | null;
  connections?: unknown;
};

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('[KnowledgeService] Failed to parse JSON value', error);
    return null;
  }
}

function serialize(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('[KnowledgeService] Failed to stringify value', error);
    return null;
  }
}

function ensureTenantMetadata(metadata: Record<string, unknown> | null, tenantId?: string | null) {
  const base = metadata ? { ...metadata } : {};
  if (tenantId) {
    base.tenantId = tenantId;
  }
  return base;
}

async function ensureDocumentOwnership(documentId: string, tenantId?: string | null) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, tenantId: true },
  });

  if (!document) {
    throw new ApplicationError('Dokument wurde nicht gefunden', 404);
  }

  if (tenantId && document.tenantId !== tenantId) {
    throw new ApplicationError('Zugriff auf das Dokument ist nicht erlaubt', 403);
  }

  return document;
}

function extractTenantFromMetadata(metadata: string | null | undefined) {
  const parsed = parseJson<{ tenantId?: string }>(metadata ?? null);
  return parsed?.tenantId ?? null;
}

function sanitizeNode(node: any) {
  return {
    id: node.id,
    content: node.content,
    type: node.type,
    documentId: node.documentId,
    document: node.document
      ? { id: node.document.id, title: node.document.title }
      : null,
    tags: parseJson<string[]>(node.tags) ?? [],
    metadata: parseJson<Record<string, unknown>>(node.metadata) ?? {},
    connections: parseJson<unknown>(node.connections),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

export const knowledgeService = {
  async listNodes(tenantId?: string | null, documentId?: string | null) {
    const where: any = {};

    if (documentId) {
      where.documentId = documentId;
    }

    if (tenantId) {
      where.OR = [
        { document: { tenantId } },
        {
          documentId: null,
          metadata: {
            contains: `"tenantId":"${tenantId}"`,
          },
        },
      ];
    } else {
      where.OR = [
        { documentId: null },
        { document: { tenantId: null } },
        { document: { tenantId: undefined } },
      ];
    }

    const nodes = await prisma.knowledgeNode.findMany({
      where,
      include: {
        document: {
          select: { id: true, title: true, tenantId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const filtered = tenantId
      ? nodes.filter((node) => {
          if (node.documentId && node.document?.tenantId === tenantId) {
            return true;
          }
          if (!node.documentId) {
            return extractTenantFromMetadata(node.metadata) === tenantId;
          }
          return false;
        })
      : nodes;

    return filtered.map(sanitizeNode);
  },

  async createNode(tenantId: string | null | undefined, payload: KnowledgeNodePayload) {
    let documentId: string | null = payload.documentId ?? null;
    if (documentId) {
      await ensureDocumentOwnership(documentId, tenantId);
    }

    const metadataObject =
      typeof payload.metadata === 'string'
        ? parseJson<Record<string, unknown>>(payload.metadata) ?? {}
        : (payload.metadata as Record<string, unknown> | null);

    const enrichedMetadata = ensureTenantMetadata(metadataObject, tenantId ?? 'PUBLIC');

    const node = await prisma.knowledgeNode.create({
      data: {
        content: payload.content.trim(),
        type: payload.type.trim().toUpperCase(),
        documentId,
        tags: serialize(payload.tags),
        metadata: serialize(enrichedMetadata),
        connections: serialize(payload.connections),
      },
      include: {
        document: { select: { id: true, title: true, tenantId: true } },
      },
    });

    return sanitizeNode(node);
  },

  async updateNode(id: string, tenantId: string | null | undefined, payload: KnowledgeNodeUpdatePayload) {
    const existing = await prisma.knowledgeNode.findUnique({
      where: { id },
      include: { document: { select: { tenantId: true, id: true } } },
    });

    if (!existing) {
      throw new ApplicationError('Knowledge Node wurde nicht gefunden', 404);
    }

    if (existing.documentId && tenantId && existing.document?.tenantId !== tenantId) {
      throw new ApplicationError('Zugriff verweigert', 403);
    }

    if (!existing.documentId && tenantId) {
      const ownerTenant = extractTenantFromMetadata(existing.metadata);
      if (ownerTenant && ownerTenant !== tenantId) {
        throw new ApplicationError('Zugriff verweigert', 403);
      }
    }

    let nextDocumentId =
      payload.documentId === undefined ? existing.documentId : payload.documentId;

    if (nextDocumentId === '') {
      nextDocumentId = null;
    }

    if (nextDocumentId) {
      await ensureDocumentOwnership(nextDocumentId, tenantId);
    }

    let metadataObject =
      typeof payload.metadata === 'string'
        ? parseJson<Record<string, unknown>>(payload.metadata) ?? {}
        : payload.metadata ?? parseJson<Record<string, unknown>>(existing.metadata) ?? {};

    if (nextDocumentId === null && tenantId) {
      metadataObject = ensureTenantMetadata(metadataObject, tenantId);
    }

    const updated = await prisma.knowledgeNode.update({
      where: { id },
      data: {
        content: payload.content !== undefined ? payload.content.trim() : undefined,
        type: payload.type !== undefined ? payload.type.trim().toUpperCase() : undefined,
        documentId: nextDocumentId,
        tags: payload.tags !== undefined ? serialize(payload.tags) : undefined,
        metadata: serialize(metadataObject),
        connections:
          payload.connections !== undefined ? serialize(payload.connections) : undefined,
      },
      include: {
        document: { select: { id: true, title: true, tenantId: true } },
      },
    });

    return sanitizeNode(updated);
  },

  async deleteNode(id: string, tenantId: string | null | undefined) {
    const existing = await prisma.knowledgeNode.findUnique({
      where: { id },
      include: { document: { select: { tenantId: true } } },
    });

    if (!existing) {
      throw new ApplicationError('Knowledge Node wurde nicht gefunden', 404);
    }

    if (existing.documentId && tenantId && existing.document?.tenantId !== tenantId) {
      throw new ApplicationError('Zugriff verweigert', 403);
    }

    if (!existing.documentId && tenantId) {
      const ownerTenant = extractTenantFromMetadata(existing.metadata);
      if (ownerTenant && ownerTenant !== tenantId) {
        throw new ApplicationError('Zugriff verweigert', 403);
      }
    }

    await prisma.knowledgeNode.delete({ where: { id } });
    return { success: true };
  },
};

