import { llmGateway } from '../core/llm/gateway.js';
import { recordLlmUsage } from '../core/llm/usage.js';

export interface DraftGenerationOptions {
  intent: string;
  question?: string;
  documentTitle?: string | null;
  connectorName?: string | null;
  payload?: Record<string, unknown> | null;
  tenantId?: string | null;
  userId?: string | null;
}

/** Offline fallback used when no LLM is configured (keeps automation working). */
function buildPlaceholderDraft(options: DraftGenerationOptions): string {
  const now = new Date().toISOString();
  const header = `# Automatischer Entwurf (${options.intent})`;
  const metaLines = [
    `- Zeitpunkt: ${now}`,
    options.documentTitle ? `- Dokument: ${options.documentTitle}` : null,
    options.connectorName ? `- Quelle: ${options.connectorName}` : null,
  ].filter(Boolean);

  const payloadExcerpt = options.payload ? `\n\n## Kontext\n\n${JSON.stringify(options.payload, null, 2)}` : '';
  const questionSection = options.question ? `\n\n## Fragestellung\n\n${options.question}` : '';

  return `${header}\n\n${metaLines.join('\n')}\n${questionSection}${payloadExcerpt}\n\n## TODOs\n\n- [ ] Inhalt redaktionell prüfen\n- [ ] Compliance & Terminologie abgleichen\n- [ ] Änderungen freigeben`;
}

function buildPrompt(options: DraftGenerationOptions): string {
  const sections = [
    `Intent: ${options.intent}`,
    options.documentTitle ? `Dokument: ${options.documentTitle}` : null,
    options.connectorName ? `Quelle/Connector: ${options.connectorName}` : null,
    options.question ? `Fragestellung: ${options.question}` : null,
    options.payload ? `Kontextdaten (JSON):\n${JSON.stringify(options.payload, null, 2)}` : null,
  ].filter(Boolean);
  return sections.join('\n\n');
}

/**
 * Generate a documentation draft. Uses the LLM gateway when configured and
 * falls back to a deterministic placeholder otherwise, so the automation
 * pipeline never hard-fails on missing credentials.
 */
export async function generateDocumentDraft(options: DraftGenerationOptions): Promise<string> {
  if (!llmGateway.isConfigured()) {
    return buildPlaceholderDraft(options);
  }

  try {
    const completion = await llmGateway.complete({
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein IT-Dokumentations-Agent. Erstelle einen strukturierten, professionellen Markdown-Entwurf auf Deutsch. ' +
            'Nutze ausschließlich die übergebenen Kontextdaten. Markiere nicht belegbare Angaben klar als TODO und erfinde keine Fakten. ' +
            'Enthalte einen Abschnitt "Review & Freigabe".',
        },
        { role: 'user', content: buildPrompt(options) },
      ],
      temperature: 0.3,
      maxTokens: 1800,
    });

    await recordLlmUsage(
      { tenantId: options.tenantId ?? null, userId: options.userId ?? null, feature: 'DRAFT', model: llmGateway.model() },
      completion.usage,
    );

    return completion.content?.trim() || buildPlaceholderDraft(options);
  } catch (error) {
    console.warn('[openai.client] Draft generation fell back to placeholder', error);
    return buildPlaceholderDraft(options);
  }
}
