# AI Transformation Roadmap

## Current implementation snapshot (Nov 2026)

### Implemented

- **Automate**
  - Connector CRUD/listing and tenant-safe connector activation toggles.
  - Generation job lifecycle controls (`retry`, `cancel`, `approve`) and suggestion updates.
  - Queue abstraction with `memory` and `servicebus` provider support in `automation.queue.ts`.
- **Centralize**
  - Knowledge node CRUD (`/api/knowledge`) including document linkage and tenant metadata handling.
  - Assistant answers with source citations from documents + knowledge nodes.
  - Global search for documents and knowledge entities (`/api/search`).
- **Comply**
  - Template schema management, annotations, trace links, quality checks, and review workflow APIs.
  - Review status transitions (`PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`).
- **Analytics**
  - Unified `/api/analytics` metrics for Automate/Centralize/Comply with connector health signals.

### Known constraints

- `AUTOMATION_QUEUE_PROVIDER=memory` is process-local and non-durable.
- Tenant-filtered global search does not reliably return orphan knowledge nodes.
- Quality checks are heuristic text checks (not yet standards-engine validation).

---

## Automatisierung & Queue-Integration

- **Kurzfristig**
  - Für lokale Entwicklung `AUTOMATION_RUN_IMMEDIATE=true` nutzen.
  - Für produktive Queue-Pfade `AUTOMATION_QUEUE_PROVIDER=servicebus` mit
    `AZURE_SERVICE_BUS_CONNECTION_STRING` + `AZURE_SERVICE_BUS_QUEUE_NAME`.
  - Worker-Betrieb regelmäßig prüfen (`npm run automation:worker`).
- **Mittelfristig**
  - Retry-/Backoff-Strategien und DLQ-Monitoring ergänzen.
  - Job-Status-Events für UI (Polling reduzieren).
- **Langfristig**
  - End-to-end orchestration (event-driven pipelines, policy-gated approvals).

## Assistant / RAG

- **Kurzfristig**
  - Retrieval-Relevanz (Ranking/weighting) über einfache `contains`-Suche hinaus verbessern.
  - Citation-Qualität erhöhen (z. B. Abschnittsreferenzen).
- **Mittelfristig**
  - Embedding-Pipeline für `KnowledgeNode.embedding` operationalisieren.
  - Feedback-Loop zwischen Quality Findings und Assistant-Antwortqualität etablieren.
- **Langfristig**
  - Mandantenübergreifende Datenschutz-Grenzen und Zugriffskontrollen weiter härten.

## Compliance Quality Layer

- **Kurzfristig**
  - `POST /api/compliance/quality/check` in CI/CD-Gates integrieren.
  - Review-Workflows als verbindliche Release-Prüfung nutzen.
- **Mittelfristig**
  - Regelwerk aus `TemplateSchema` direkt auf Dokument-Inhalte anwenden.
  - Findings automatisch in strukturierte Maßnahmenpläne überführen.
- **Langfristig**
  - Audit-ready metrics (MTTR, Review SLA, Trace coverage) mit Zielwerten steuern.
