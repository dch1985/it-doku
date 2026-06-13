import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ApplicationError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import { llmGateway } from '../core/llm/gateway.js';
import { runAgent } from '../core/agent/runtime.js';
import { skillService } from '../core/skills/runner.js';

const router = Router();
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';

router.use(isDevMode ? devAuthenticate : authenticate);
router.use(tenantMiddleware);

const ASSISTANT_SYSTEM_PROMPT = `Du bist ein agentischer IT-Dokumentations-Assistent.
Beantworte Fragen AUSSCHLIESSLICH auf Basis der Tenant-Daten, die du über die bereitgestellten Tools abrufst
(Dokumente, Assets/CMDB, Netzwerkgeräte, Verträge, Knowledge Graph).
Rufe so viele Tools auf wie nötig, um die Frage zu belegen.
Wenn die Tools keine Antwort hergeben, sage das ehrlich und erfinde nichts.
Antworte präzise auf Deutsch und nenne am Ende die genutzten Quellen (z.B. Dokument-/Asset-IDs).`;

function isLlmConfigError(error: any): boolean {
  return error?.code === 'LLM_NOT_CONFIGURED' || error?.name === 'LlmNotConfiguredError';
}

/** List available skills. */
router.get('/skills', (_req: Request, res: Response) => {
  res.json(skillService.list());
});

router.get('/skills/:id', (req: Request, res: Response) => {
  const skill = skillService.get(req.params.id);
  if (!skill) {
    return res.status(404).json({ error: 'Skill nicht gefunden' });
  }
  res.json(skill);
});

/** Agentic question answering over the tenant's own data. */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const question = String(req.body?.question ?? '').trim();
    if (!question) {
      throw new ApplicationError('Eine Frage wird benötigt', 400);
    }

    if (!llmGateway.isConfigured()) {
      return res.status(503).json({ error: 'LLM ist nicht konfiguriert', message: 'Bitte AZURE_OPENAI_ENDPOINT und AZURE_OPENAI_KEY setzen.' });
    }

    const result = await runAgent({
      systemPrompt: ASSISTANT_SYSTEM_PROMPT,
      userMessage: question,
      goal: 'Agentic Q&A',
      trigger: 'MANUAL',
      allowedTools: Array.isArray(req.body?.allowedTools) ? req.body.allowedTools : undefined,
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
      temperature: 0.2,
    });

    res.json({
      runId: result.runId,
      answer: result.content,
      steps: result.steps,
      toolCalls: result.toolCalls,
      evidenceCount: result.evidenceCount,
      usage: result.usage,
    });
  } catch (error: any) {
    if (isLlmConfigError(error)) {
      return res.status(503).json({ error: 'LLM ist nicht konfiguriert' });
    }
    console.error('[Agent] ask failed', error);
    res.status(error.statusCode ?? 500).json({ error: 'Agent-Anfrage fehlgeschlagen', message: error.message ?? 'Unexpected error' });
  }
});

/** Start a skill run. */
router.post('/runs', async (req: Request, res: Response) => {
  try {
    const skillId = String(req.body?.skillId ?? '').trim();
    if (!skillId) {
      throw new ApplicationError('skillId wird benötigt', 400);
    }

    if (!llmGateway.isConfigured()) {
      return res.status(503).json({ error: 'LLM ist nicht konfiguriert', message: 'Bitte AZURE_OPENAI_ENDPOINT und AZURE_OPENAI_KEY setzen.' });
    }

    const result = await skillService.run({
      skillId,
      input: typeof req.body?.input === 'object' && req.body.input ? req.body.input : {},
      documentId: req.body?.documentId ?? null,
      tenantId: req.tenant?.id ?? null,
      userId: req.user?.id ?? null,
      trigger: 'MANUAL',
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (isLlmConfigError(error)) {
      return res.status(503).json({ error: 'LLM ist nicht konfiguriert' });
    }
    console.error('[Agent] skill run failed', error);
    res.status(error.statusCode ?? 500).json({ error: 'Skill-Lauf fehlgeschlagen', message: error.message ?? 'Unexpected error' });
  }
});

/** List recent agent runs for the tenant. */
router.get('/runs', async (req: Request, res: Response) => {
  try {
    const runs = await prisma.agentRun.findMany({
      where: { tenantId: req.tenant?.id ?? undefined },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        skillId: true,
        skillVersion: true,
        status: true,
        trigger: true,
        goal: true,
        summary: true,
        stepCount: true,
        promptTokens: true,
        completionTokens: true,
        createdAt: true,
        completedAt: true,
      },
    });
    res.json(runs);
  } catch (error: any) {
    console.error('[Agent] list runs failed', error);
    res.status(500).json({ error: 'Läufe konnten nicht geladen werden', message: error.message ?? 'Unexpected error' });
  }
});

/** Full run detail with the step timeline and the evidence trail. */
router.get('/runs/:id', async (req: Request, res: Response) => {
  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: req.params.id },
      include: {
        steps: { orderBy: { index: 'asc' } },
        evidence: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!run || (req.tenant?.id && run.tenantId && run.tenantId !== req.tenant.id)) {
      return res.status(404).json({ error: 'Lauf nicht gefunden' });
    }

    res.json(run);
  } catch (error: any) {
    console.error('[Agent] run detail failed', error);
    res.status(500).json({ error: 'Lauf konnte nicht geladen werden', message: error.message ?? 'Unexpected error' });
  }
});

export default router;
