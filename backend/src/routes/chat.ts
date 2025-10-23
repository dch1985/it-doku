import { Router } from 'express';
import { AzureOpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const azureClient = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-02-01',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
});

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Ungültiges Nachrichten-Format' });
    }

    console.log(`[Chat] Processing ${messages.length} messages`);

    // Hole Dokumentations-Kontext
    const docs = await prisma.generatedDocumentation.findMany({
      take: 10,
      orderBy: { generatedAt: 'desc' },
      select: {
        filePath: true,
        fileName: true,
        description: true,
        functions: true,
        dependencies: true,
        usageExamples: true,
        language: true,
      },
    });

    const contextParts = docs.map(doc => {
      const functionsText = doc.functions 
        ? JSON.stringify(doc.functions, null, 2)
        : 'Keine Funktionen dokumentiert';

      const deps = doc.dependencies ? JSON.parse(doc.dependencies) : [];

      return `
**${doc.fileName || doc.filePath}** (${doc.language})
- Beschreibung: ${doc.description}
- Dependencies: ${deps.join(', ') || 'keine'}
- Funktionen:
${functionsText}
${doc.usageExamples ? `- Verwendung:\n${doc.usageExamples}` : ''}
`;
    }).join('\n---\n');

    const systemPrompt = `Du bist ein intelligenter IT-Dokumentations-Assistent.

VERFÜGBARE DOKUMENTATION:
${contextParts}

Beantworte Fragen basierend auf dieser Dokumentation. Wenn keine relevante Dokumentation verfügbar ist, antworte trotzdem hilfreich zu IT-Themen.`;

    // Streaming Response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = await azureClient.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }

    res.end();

  } catch (error) {
    console.error('[Chat] Error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Chat-Anfrage fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    } else {
      res.end();
    }
  }
});

router.get('/chat/context', async (req, res) => {
  try {
    const docs = await prisma.generatedDocumentation.findMany({
      take: 10,
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        filePath: true,
        fileName: true,
        description: true,
        generatedAt: true,
      },
    });

    res.json({
      success: true,
      contextDocuments: docs.length,
      documents: docs,
    });
  } catch (error) {
    console.error('[Chat Context] Error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Kontexts' });
  }
});

export default router;