# AI Transformation Roadmap

## Aktueller Umsetzungsstand (Nov 2026)

- **Automate**: Connector-, Job- und Suggestion-Workflows sind produktiv (`/api/automation/*`) inklusive Retry/Cancel/Approve.
- **Queue-Layer**: `memory` und `servicebus` Provider sind im Backend vorhanden; Worker-Lauf über `npm run automation:worker`.
- **Centralize**: Assistant + Trace-API (`/api/assistant/*`), Knowledge-Node-Management (`/api/knowledge`) und globale Suche (`/api/search`) sind implementiert.
- **Comply**: Schema-, Annotation-, Trace-Link-, Quality- und Review-Endpunkte (`/api/compliance/*`) sind aktiv und mit Analytics-KPIs verknüpft.

## Automatisierung & Queue-Integration

- **Kurzfristig:**
  - Setze `AUTOMATION_RUN_IMMEDIATE=true`, um Jobs im lokalen Speicher synchron zu verarbeiten.
  - Alternativ `AUTOMATION_QUEUE_AUTORUN=true` aktivieren, damit die In-Memory-Queue automatisch `processJob` aufruft.
  - Einzelne Jobs per CLI ausführen: `npm run automation:job -- <jobId>` (oder Worker mit `npm run automation:worker`).
- **Mittelfristig:**
  - Service-Bus-Betrieb absichern (DLQ-Handling, Retry-Strategie, Monitoring auf Backlog/Poison Messages).
  - Idempotenz-Regeln für `processJob` und Job-Replays präzisieren, um Doppelverarbeitung zu verhindern.
  - Infrastruktur-Runbooks für Worker-Scaling und Graceful Shutdown ergänzen.
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
