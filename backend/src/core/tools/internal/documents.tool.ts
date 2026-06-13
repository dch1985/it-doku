import { prisma } from '../../../lib/prisma.js';
import { ok, fail, type Tool } from '../types.js';

function stripHtml(content: string | null | undefined): string {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const searchDocumentsTool: Tool = {
  name: 'search_documents',
  description:
    'Durchsucht die bestehende IT-Dokumentation des Tenants nach Titel, Inhalt oder Kategorie. Nutze dies, um vorhandenes Wissen zu finden, bevor du etwas Neues schreibst.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Suchbegriff' },
      limit: { type: 'number', description: 'Maximale Trefferzahl (Standard 5)' },
    },
    required: ['query'],
  },
  async execute(args, context) {
    const query = String(args.query ?? '').trim();
    if (!query) return fail('query ist erforderlich');
    const limit = Math.min(Number(args.limit) || 5, 20);

    const documents = await prisma.document.findMany({
      where: {
        tenantId: context.tenantId ?? undefined,
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { category: { contains: query } },
        ],
      },
      select: { id: true, title: true, category: true, status: true, updatedAt: true, content: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const results = documents.map((doc) => {
      const excerpt = stripHtml(doc.content).slice(0, 280);
      context.recordEvidence({
        sourceType: 'DOCUMENT',
        source: 'search_documents',
        reference: `document:${doc.id}`,
        claim: `Dokument "${doc.title}" (${doc.category}, Status ${doc.status})`,
        data: { id: doc.id, title: doc.title, excerpt },
      });
      return { id: doc.id, title: doc.title, category: doc.category, status: doc.status, excerpt };
    });

    return ok({ count: results.length, documents: results });
  },
};

export const getDocumentTool: Tool = {
  name: 'get_document',
  description: 'Liest ein einzelnes Dokument vollständig anhand seiner ID.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Dokument-ID' } },
    required: ['id'],
  },
  async execute(args, context) {
    const id = String(args.id ?? '').trim();
    if (!id) return fail('id ist erforderlich');

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, title: true, category: true, status: true, content: true, tenantId: true, updatedAt: true },
    });

    if (!document) return fail('Dokument nicht gefunden');
    if (context.tenantId && document.tenantId && document.tenantId !== context.tenantId) {
      return fail('Zugriff auf das Dokument ist nicht erlaubt');
    }

    context.recordEvidence({
      sourceType: 'DOCUMENT',
      source: 'get_document',
      reference: `document:${document.id}`,
      claim: `Volltext von "${document.title}" gelesen`,
      data: { id: document.id, updatedAt: document.updatedAt },
    });

    return ok({
      id: document.id,
      title: document.title,
      category: document.category,
      status: document.status,
      content: stripHtml(document.content),
    });
  },
};
