export interface DraftGenerationOptions {
  intent: string;
  question?: string;
  documentTitle?: string | null;
  connectorName?: string | null;
  payload?: Record<string, unknown> | null;
}

// Platzhalter für zukünftige Azure OpenAI / GPT Integration.
export async function generateDocumentDraft(options: DraftGenerationOptions): Promise<string> {
  const now = new Date().toISOString();
  const header = `# Automatischer Entwurf (${options.intent})`;
  const metaLines = [
    `- Zeitpunkt: ${now}`,
    options.documentTitle ? `- Dokument: ${options.documentTitle}` : null,
    options.connectorName ? `- Quelle: ${options.connectorName}` : null,
  ].filter(Boolean);

  const payloadExcerpt = options.payload ? `\n\n## Kontext\n\n${JSON.stringify(options.payload, null, 2)}` : '';
  const questionSection = options.question
    ? `\n\n## Fragestellung\n\n${options.question}`
    : '';

  return `${header}\n\n${metaLines.join('\n')}\n${questionSection}${payloadExcerpt}\n\n## TODOs\n\n- [ ] Inhalt redaktionell prüfen\n- [ ] Compliance & Terminologie abgleichen\n- [ ] Änderungen freigeben`;
}
