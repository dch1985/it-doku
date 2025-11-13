import { prisma } from '../lib/prisma.js';

export interface AssistantQueryInput {
  question: string;
  audience?: string;
  conversationId?: string;
  title?: string;
  tenantId?: string | null;
  userId?: string | null;
}

export interface AssistantCitation {
  documentId: string;
  title: string | null;
  excerpt?: string | null;
}

function normalizeAudience(audience?: string | null): 'BEGINNER' | 'PRACTITIONER' | 'EXPERT' {
  const value = audience?.toUpperCase();
  if (value === 'BEGINNER' || value === 'EXPERT') {
    return value;
  }
  return 'PRACTITIONER';
}

function stripHtml(content: string | null | undefined): string {
  if (!content) return '';
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function findRelevantDocuments(question: string, tenantId?: string | null) {
  return prisma.document.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      OR: [
        { title: { contains: question } },
        { content: { contains: question } },
        { category: { contains: question } },
      ],
    },
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      updatedAt: true,
    },
    take: 5,
  });
}

function buildAnswerText(audience: 'BEGINNER' | 'PRACTITIONER' | 'EXPERT', question: string, citations: AssistantCitation[]) {
  if (citations.length === 0) {
    const intro = audience === 'BEGINNER'
      ? 'Mir liegen noch keine passenden Dokumente in deinem Tenant vor.'
      : 'Für diese Fragestellung existieren in der Wissensbasis aktuell keine verknüpften Dokumente.';
    return `${intro} Ergänze bitte relevante Dokumentation oder starte einen Automate-Job, um Inhalte zu generieren.`;
  }

  const headline = audience === 'BEGINNER'
    ? 'Hier ist eine leicht verständliche Antwort:'
    : audience === 'EXPERT'
      ? 'Zusammenfassung für Expert:innen:'
      : 'Hier sind die wichtigsten Punkte:';

  const bulletLines = citations.map((citation) => `- ${citation.title ?? 'Unbenanntes Dokument'} (ID: ${citation.documentId})`);

  const guidance = audience === 'BEGINNER'
    ? 'Bitte lies diese Dokumente Schritt für Schritt; sie erklären die Grundlagen.'
    : audience === 'EXPERT'
      ? 'Nutze die referenzierten Dokumente für tiefergehende technische Details und Compliance-Referenzen.'
      : 'Prüfe die Dokumente für weiterführende Informationen und halte den Review-Workflow ein.';

  return `${headline}\n\n${bulletLines.join('\n')}\n\n${guidance}`;
}

async function buildAssistantResponse(input: AssistantQueryInput) {
  const audience = normalizeAudience(input.audience);
  const documents = await findRelevantDocuments(input.question, input.tenantId);

  const citations: AssistantCitation[] = documents.map((doc) => ({
    documentId: doc.id,
    title: doc.title,
    excerpt: stripHtml(doc.content).slice(0, 220) || null,
  }));

  const answer = buildAnswerText(audience, input.question, citations.slice(0, 3));

  return { answer, citations: citations.slice(0, 3), audience };
}

export const assistantService = {
  listConversations(tenantId?: string | null, userId?: string | null) {
    return prisma.conversation.findMany({
      where: {
        tenantId: tenantId ?? undefined,
        userId: userId ?? undefined,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });
  },

  async answerQuestion(input: AssistantQueryInput) {
    const response = await buildAssistantResponse(input);
    const persistResult = await this.appendConversation(input, response.answer, response.citations);
    return {
      conversationId: persistResult.conversationId,
      answer: response.answer,
      audience: persistResult.audience,
      traceId: persistResult.traceId,
      citations: response.citations,
    };
  },

  async appendConversation(input: AssistantQueryInput, answer: string, citations: AssistantCitation[] = []) {
    const normalizedAudience = normalizeAudience(input.audience);
    const question = input.question;

    let conversationId = input.conversationId ?? null;

    if (conversationId) {
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          messages: {
            create: [
              { role: 'USER', content: question },
              { role: 'ASSISTANT', content: answer },
            ],
          },
        },
      }).catch(async () => {
        const created = await prisma.conversation.create({
          data: {
            id: conversationId ?? undefined,
            title: input.title ?? 'Assistant Session',
            tenantId: input.tenantId ?? 'PUBLIC',
            userId: input.userId ?? 'SYSTEM',
            messages: {
              create: [
                { role: 'USER', content: question },
                { role: 'ASSISTANT', content: answer },
              ],
            },
          },
        });
        conversationId = created.id;
        return created;
      });

      if (!updated) {
        // conversation was recreated in catch block above
      }
    } else {
      const created = await prisma.conversation.create({
        data: {
          title: input.title ?? 'Assistant Session',
          tenantId: input.tenantId ?? 'PUBLIC',
          userId: input.userId ?? 'SYSTEM',
          messages: {
            create: [
              { role: 'USER', content: question },
              { role: 'ASSISTANT', content: answer },
            ],
          },
        },
      });
      conversationId = created.id;
    }

    const trace = await prisma.conversationTrace.create({
      data: {
        question,
        answer,
        audience: normalizedAudience,
        citations: JSON.stringify(citations),
        tenantId: input.tenantId ?? null,
        conversationId: conversationId ?? undefined,
      },
    });

    return { conversationId: conversationId!, audience: normalizedAudience, traceId: trace.id, citations };
  },

  listTraces(tenantId?: string | null) {
    return prisma.conversationTrace.findMany({
      where: {
        tenantId: tenantId ?? null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
};
