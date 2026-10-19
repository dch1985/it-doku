# AI Transformation Roadmap

## Aktueller Stand (Code-Validierung)

- Queue-Provider `memory` **und** `servicebus` sind bereits implementiert (`backend/src/lib/automation.queue.ts`).
- Worker-Einstiegspunkte sind vorhanden: `npm run automation:worker` (Listener) und `npm run automation:job -- <jobId>` (Einzeljob).
- Der Assistant nutzt aktuell tenant-gefilterte Keyword-Suche (`contains`) auf Dokumenten/Knowledge Nodes, nicht Embeddings.
- Compliance Quality Checks sind derzeit regelbasiert (Pattern-Prüfungen auf Placeholder/Passwort/Review/Owner).

## Automatisierung & Queue-Integration

- **Kurzfristig:**
  - Setze `AUTOMATION_RUN_IMMEDIATE=true`, um Jobs im lokalen Speicher synchron zu verarbeiten.
  - Alternativ `AUTOMATION_QUEUE_AUTORUN=true` aktivieren, damit die In-Memory-Queue automatisch `processJob` aufruft.
  - Einzelne Jobs per CLI ausführen: `npm run automation:job -- <jobId>` (oder Worker mit `npm run automation:worker`).
- **Mittelfristig:**
  - Hinterlege `AUTOMATION_QUEUE_PROVIDER=servicebus` produktiv und ergänze `AZURE_SERVICE_BUS_CONNECTION_STRING` + `AZURE_SERVICE_BUS_QUEUE_NAME`.
  - Hardening für Queue-Betrieb ergänzen (DLQ-Strategie, Retry-Policies, dedizierte Worker-Rollen).
  - Skaliere Worker horizontal (mehrere Consumer) und überwache Durchsatz/Latenz.
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
