# AI Transformation Roadmap

This roadmap is aligned with the current backend/frontend implementation.

## Automatisierung & Queue-Integration

### Aktueller Stand

- `AUTOMATION_RUN_IMMEDIATE=true` verarbeitet Jobs direkt beim Erstellen.
- `AUTOMATION_QUEUE_AUTORUN=true` verbindet Publish + Consume im selben Prozess.
- Queue-Provider `memory` und `servicebus` sind implementiert (`backend/src/lib/automation.queue.ts`).
- Worker CLI ist produktiv nutzbar (`npm run automation:worker`, `npm run automation:job -- <jobId>`).
- Job-Steuerung über API vorhanden (`retry`, `cancel`, `approve`).

### Nächste Schritte

- Retry-/Backoff-Strategie für fehlgeschlagene Queue-Nachrichten standardisieren.
- Dead-letter/poison-message Handling für Service Bus ergänzen.
- Konsistente Betriebsmetriken (Publish-Latenz, Worker-Durchsatz, Retry-Quote) erfassen.

### Langfristig

- Ereignisgesteuerte Statusupdates (z. B. WebSocket/SignalR).
- Policy-basierte Priorisierung für Job-Queues (critical docs zuerst).

## Assistant / RAG

### Aktueller Stand

- Assistant beantwortet Fragen über tenant-spezifische Suche in Dokumenten + Knowledge Nodes.
- Antworten enthalten strukturierte `citations` (Document/Knowledge), gespeichert in Conversation Traces.
- Audience-Level (`BEGINNER`, `PRACTITIONER`, `EXPERT`) ist im Antwortformat berücksichtigt.

### Nächste Schritte

- Semantische Suche (Embeddings) zusätzlich zur aktuellen Keyword-Relevanz einführen.
- Exzerpt- und Zitierungslogik um präzise Abschnittspositionen erweitern.
- Optional echte LLM-Antworten integrieren (aktuell sind Draft/Antworten regelbasiert bzw. template-basiert erzeugt).

### Langfristig

- Qualitäts-Feedback aus Findings in Ranking/Antwortqualität zurückspielen.
- Striktere Datenschutz-/Zugriffspolicys für RAG-Kontext.

## Compliance Quality Layer

### Aktueller Stand

- Template-Schemas, Annotationen, Trace-Links und Review-Workflow sind über API verfügbar.
- `POST /api/compliance/quality/check` erzeugt regelbasierte Findings pro Dokument.
- Findings und Review-Kennzahlen fließen in `/api/analytics` ein.

### Nächste Schritte

- Regelableitung aus `TemplateSchema` (statt nur statischer Pattern-Prüfungen).
- Automatische Übergabe kritischer Findings in den Review-Workflow.
- Audit-Export für Findings + Review-Historie definieren.

### Langfristig

- Vollständige Compliance-Scores pro Dokumenttyp/Control-Set.
- CI-Gates für dokumentationskritische Releases.
