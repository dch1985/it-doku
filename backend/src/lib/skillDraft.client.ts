export interface DraftGenerationOptions {
  intent: string;
  question?: string;
  documentTitle?: string | null;
  connectorName?: string | null;
  payload?: Record<string, unknown> | null;
}

// Deterministic skill draft scaffold. Keep output reviewable and evidence-driven.
export async function generateDocumentDraft(options: DraftGenerationOptions): Promise<string> {
  const now = new Date().toISOString();
  const header = `# Skill Draft (${options.intent})`;
  const metaLines = [
    `- Zeitpunkt: ${now}`,
    options.documentTitle ? `- Dokument: ${options.documentTitle}` : null,
    options.connectorName ? `- Quelle: ${options.connectorName}` : null,
  ].filter(Boolean);

  const payloadExcerpt = options.payload ? `\n\n## Kontext\n\n${JSON.stringify(options.payload, null, 2)}` : '';
  const questionSection = options.question
    ? `\n\n## Fragestellung\n\n${options.question}`
    : '';

  return `${header}\n\n${metaLines.join('\n')}\n${questionSection}${payloadExcerpt}\n\n## Review checklist\n\n- [ ] Verify source evidence\n- [ ] Check compliance and terminology\n- [ ] Approve changes before publishing`;
}
