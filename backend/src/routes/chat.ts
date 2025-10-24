import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Azure OpenAI via OpenAI SDK
const baseURL = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '') + 
  '/openai/deployments/' + (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4');

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  baseURL: baseURL,
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY! },
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;
    
    console.log('[Chat] Received', messages.length, 'messages');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemMessage: ChatMessage = {
      role: 'system',
      content: 'Du bist ein hilfreicher IT-Dokumentations-Assistent. Du hilfst Benutzern bei der Erstellung und Verwaltung von IT-Dokumentation, Server-Dokumentation, Netzwerk-Diagrammen und technischen Runbooks. Antworte praezise, professionell und hilfreich auf Deutsch.'
    };

    const stream = await client.chat.completions.create({
      model: '',
      messages: [systemMessage, ...messages],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
