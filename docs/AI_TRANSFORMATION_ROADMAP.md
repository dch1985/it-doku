# AI Transformation Roadmap

## Automatisierung & Queue-Integration
- **Kurzfristig:**
  - Setze `AUTOMATION_RUN_IMMEDIATE=true`, um Jobs im lokalen Speicher synchron zu verarbeiten.
  - Alternativ `AUTOMATION_QUEUE_AUTORUN=true` aktivieren, damit die In-Memory-Queue automatisch `processJob` aufruft.
  - Einzelne Jobs per CLI ausführen: `npm run automation:job -- <jobId>` (oder Worker mit `npm run automation:worker`).
- **Mittelfristig:**
  - Hinterlege `AUTOMATION_QUEUE_PROVIDER=servicebus` (Platzhalter) und ergänze `AZURE_SERVICE_BUS_CONNECTION_STRING` + `AZURE_SERVICE_BUS_QUEUE_NAME`.
  - Ersetze `automation.lib.queue.ts` durch einen Azure Service Bus Client und publiziere `GenerationJobMessage`s in die Queue.
  - Implementiere einen Worker (z. B. `automation.worker.ts`), der Nachrichten konsumiert und `automationService.processJob` ausführt.
- **Langfristig:**
  - Asynchrones Status-Update via WebSocket/SignalR ergänzen.
  - SLA-Monitoring und Retry-Policies (Dead Letter Queue) einführen.
  - MPC-/Agenten-Orchestrierung prüfen, um End-to-End-Automationen ohne manuelle Trigger auszulösen.

## Assistant / RAG
- **Kurzfristig:**
  - Hinterlege `AZURE_OPENAI_*` Variablen und tausche `generateDocumentDraft` / `assistantService.buildAssistantResponse` gegen echte Azure OpenAI Aufrufe.
  - Verfeinere die Suche nach relevanten Dokumenten mit Vektoren (`KnowledgeNode.embedding`).
- **Mittelfristig:**
  - Implementiere Chunking & Embedding-Pipeline; speichere Embeddings in `KnowledgeNode`.
  - Ergänze `citations` um genaue Abschnitts-IDs / Pfade für Traceability.
- **Langfristig:**
  - Feedback-Loop etablieren (QualityFindings ↔ Assistant Ranking).
  - Differential Privacy & Zugriffskontrollen für RAG-Kontext sicherstellen.

## Compliance Quality Layer
- **Kurzfristig:**
  - `POST /api/compliance/quality/check` in CI/CD integrieren, um Dokumente vor Releases zu prüfen.
- **Mittelfristig:**
  - Regelwerk aus `TemplateSchema` ableiten und dynamisch anwenden.
  - Findings automatisch in Review-Workflow überführen.
- **Langfristig:**
  - Metriken in Analytics Dashboard anzeigen (z. B. Findings pro Kategorie, MTTR für Resolves).
