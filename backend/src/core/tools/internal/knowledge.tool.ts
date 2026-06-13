import { prisma } from '../../../lib/prisma.js';
import { ok, fail, type Tool } from '../types.js';

function stripHtml(content: string | null | undefined): string {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const searchKnowledgeTool: Tool = {
  name: 'search_knowledge',
  description:
    'Durchsucht den Knowledge Graph (Konzepte, Technologien, Prozesse, Entitäten) des Tenants. Liefert verknüpfte Wissensobjekte als belegbare Quellen.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Suchbegriff' },
      type: { type: 'string', description: 'Optionaler Knoten-Typ: CONCEPT, CODE, PERSON, TECHNOLOGY, PROCESS, ENTITY' },
      limit: { type: 'number', description: 'Maximale Trefferzahl (Standard 8)' },
    },
    required: ['query'],
  },
  async execute(args, context) {
    const query = String(args.query ?? '').trim();
    if (!query) return fail('query ist erforderlich');
    const limit = Math.min(Number(args.limit) || 8, 25);

    const nodes = await prisma.knowledgeNode.findMany({
      where: {
        ...(args.type ? { type: String(args.type).toUpperCase() } : {}),
        AND: [
          { OR: [{ content: { contains: query } }, { tags: { contains: query } }] },
          ...(context.tenantId
            ? [
                {
                  OR: [
                    { document: { tenantId: context.tenantId } },
                    { metadata: { contains: `"tenantId":"${context.tenantId}"` } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        type: true,
        content: true,
        documentId: true,
        document: { select: { id: true, title: true } },
      },
      take: limit,
    });

    const results = nodes.map((node) => {
      const excerpt = stripHtml(node.content).slice(0, 240);
      context.recordEvidence({
        sourceType: 'DATABASE',
        source: 'search_knowledge',
        reference: `knowledge_node:${node.id}`,
        claim: `${node.type} Knowledge Node${node.document?.title ? ` (aus "${node.document.title}")` : ''}`,
        data: { id: node.id, type: node.type, excerpt },
      });
      return {
        id: node.id,
        type: node.type,
        excerpt,
        documentId: node.documentId,
        documentTitle: node.document?.title ?? null,
      };
    });

    return ok({ count: results.length, nodes: results });
  },
};
