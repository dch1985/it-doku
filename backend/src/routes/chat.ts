import { Router, Request, Response } from 'express';
import { llmGateway } from '../core/llm/gateway.js';
import type { LlmMessage } from '../core/llm/types.js';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

const SYSTEM_PROMPT =
  'Du bist ein hilfreicher IT-Dokumentations-Assistent. Du hilfst Benutzern bei der Erstellung und Verwaltung von ' +
  'IT-Dokumentation, Server-Dokumentation, Netzwerk-Diagrammen und technischen Runbooks. Antworte praezise, ' +
  'professionell und hilfreich auf Deutsch.';

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;
    console.log('[Chat] Received', messages?.length ?? 0, 'messages');

    if (!llmGateway.isConfigured()) {
      return res.status(503).json({
        error: 'LLM ist nicht konfiguriert',
        message: 'Bitte AZURE_OPENAI_ENDPOINT und AZURE_OPENAI_KEY setzen.',
      });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const llmMessages: LlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(messages ?? []).map((message) => ({ role: message.role, content: message.content })),
    ];

    for await (const delta of llmGateway.stream({ messages: llmMessages, temperature: 0.7, maxTokens: 2000 })) {
      res.write(delta);
    }

    res.end();
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    } else {
      res.end();
    }
  }
});

export default router;
