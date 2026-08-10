# Automation, Knowledge & Compliance Runbook

Dieses Runbook dokumentiert die zuletzt erweiterten Subsysteme **Automate**, **Centralize** und **Comply** auf Basis der aktuellen Implementierung.

## 1) Scope und Codepfade

| Bereich    | Backend                                                                                                                                                                                        | Frontend                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automate   | `backend/src/routes/automation.ts`, `backend/src/services/automation.service.ts`, `backend/src/lib/automation.queue.ts`, `backend/src/workers/automation.worker.ts`                            | `frontend/src/hooks/useAutomation.ts`, `frontend/src/pages/Automate.tsx`                                                                                      |
| Centralize | `backend/src/routes/knowledge.ts`, `backend/src/services/knowledge.service.ts`, `backend/src/routes/assistant.ts`, `backend/src/services/assistant.service.ts`, `backend/src/routes/search.ts` | `frontend/src/hooks/useKnowledgeNodes.ts`, `frontend/src/hooks/useAssistant.ts`, `frontend/src/hooks/useGlobalSearch.ts`, `frontend/src/pages/Centralize.tsx` |
| Comply     | `backend/src/routes/compliance.ts`, `backend/src/services/compliance.service.ts`                                                                                                               | `frontend/src/hooks/useCompliance.ts`, `frontend/src/pages/Comply.tsx`                                                                                        |
| KPI Layer  | `backend/src/routes/analytics.ts`                                                                                                                                                              | `frontend/src/hooks/useAnalytics.ts`                                                                                                                          |

## 2) Zugriffsmodell und Voraussetzungen

- Geschützte Routen verwenden Auth + Tenant-Kontext.
- Tenant kann per `X-Tenant-ID`, `X-Tenant-Slug`, Subdomain oder Query übergeben werden.
- In Dev-Modus (`NODE_ENV=development` oder `DEV_AUTH_ENABLED=true`) sind tenantlose Requests teilweise erlaubt.

Beispiel-Header:

```bash
export API_URL="http://localhost:3002/api"
export TENANT_ID="<tenant-id>"
export TOKEN="<jwt>"

export AUTH_HEADERS=(
  -H "Authorization: Bearer ${TOKEN}"
  -H "X-Tenant-ID: ${TENANT_ID}"
  -H "Content-Type: application/json"
)
```

## 3) Automate-Workflow

### 3.1 Connector anlegen und verwalten

```bash
curl -X POST "${API_URL}/automation/connectors" \
  "${AUTH_HEADERS[@]}" \
  -d '{
    "name": "GitHub Engineering Docs",
    "type": "GIT",
    "config": { "owner": "org", "repo": "it-doku" }
  }'
```

Wichtige Constraints:

- `name` und `type` sind Pflichtfelder.
- `type` wird serverseitig uppercased gespeichert.
- Connectoren mit `tenantId=null` gelten als global und können **nicht** per `PATCH /connectors/:id` umgeschaltet werden.

### 3.2 Job starten

```bash
curl -X POST "${API_URL}/automation/jobs" \
  "${AUTH_HEADERS[@]}" \
  -d '{
    "intent": "UPDATE",
    "title": "Update Netzwerk-Dokumentation",
    "documentId": "<document-id>",
    "connectorId": "<connector-id>",
    "payload": { "scope": "network" }
  }'
```

Statusmodell (`generationJob.status`):

- `PENDING` → `RUNNING` → `COMPLETED`
- Fehlerfall: `FAILED`
- Abbruch: `CANCELLED`

Operator-Aktionen:

- Retry nur sinnvoll bei `FAILED`/nicht laufenden Jobs: `POST /automation/jobs/:id/retry`
- Cancel nur bei `PENDING` oder `RUNNING`: `POST /automation/jobs/:id/cancel`
- Manuelles Freigeben: `POST /automation/jobs/:id/approve`

### 3.3 Vorschläge (Suggestions) triagieren

```bash
curl -X PATCH "${API_URL}/automation/suggestions/<suggestion-id>" \
  "${AUTH_HEADERS[@]}" \
  -d '{ "status": "APPLIED", "resolution": "Übernommen nach Review" }'
```

Hinweise:

- `status` wird uppercased gespeichert (`OPEN`, `APPLIED`, `DISMISSED`).
- Bei `APPLIED`/`DISMISSED` setzt das Backend automatisch `resolvedAt`.

## 4) Queue- und Worker-Betrieb (Automate)

Relevante Variablen (`backend/env.sample`):

```env
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_PROVIDER=memory   # memory | servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_SERVICE_BUS_QUEUE_NAME=
```

Betriebsmodi:

- `memory`: Publish/Subscribe im selben Prozess.
- `servicebus`: echte Queue via Azure Service Bus.

CLI-Betrieb:

```bash
cd backend

# Einzelnen Job verarbeiten
npm run automation:job -- <jobId>

# Dauerhafter Listener (nutzt gewählten Queue-Provider)
npm run automation:worker
```

**Wichtig:** Bei `AUTOMATION_QUEUE_PROVIDER=servicebus` müssen Connection String und Queue-Name gesetzt sein, sonst schlägt die Queue-Initialisierung fehl.

## 5) Centralize-Workflow

### 5.1 Knowledge Nodes pflegen

```bash
curl -X POST "${API_URL}/knowledge" \
  "${AUTH_HEADERS[@]}" \
  -d '{
    "content": "Firewall-Rotation erfolgt quartalsweise.",
    "type": "PROCESS",
    "documentId": "<optional-document-id>",
    "tags": ["security", "ops"]
  }'
```

Verhalten/Constraints:

- `content` und `type` sind Pflicht.
- `type` wird uppercased gespeichert.
- Bei dokumentlosen Nodes (`documentId=null`) ergänzt der Service Tenant-Metadaten zur Isolation.
- Delete liefert `204 No Content`, wenn erfolgreich.

### 5.2 Assistant + Traceability

```bash
curl -X POST "${API_URL}/assistant/query" \
  "${AUTH_HEADERS[@]}" \
  -d '{
    "question": "Wie ist unser Netzwerk-Review-Prozess aufgebaut?",
    "audience": "PRACTITIONER",
    "title": "Netzwerk Q&A"
  }'
```

Antwort enthält:

- `answer`
- `traceId`
- `citations[]` aus Dokumenten **und** Knowledge Nodes

### 5.3 Global Search

```bash
curl "${API_URL}/search?q=firewall&type=knowledge&limit=10" "${AUTH_HEADERS[@]}"
```

- `type` optional: `documents` oder `knowledge`.
- Ergebnisse enthalten Scores + Highlight-/Snippet-Felder.

## 6) Comply-Workflow

### 6.1 Schema/Annotation/Trace-Link

- `POST /compliance/schemas`: Template-Schema anlegen (`name` + `schema` Pflicht)
- `POST /compliance/annotations`: `documentId`, `key`, `value` Pflicht
- `POST /compliance/trace-links`: Source/Target-Paare verknüpfen

### 6.2 Quality Checks ausführen

```bash
curl -X POST "${API_URL}/compliance/quality/check" \
  "${AUTH_HEADERS[@]}" \
  -d '{ "documentId": "<document-id>" }'
```

Aktuelle Regelbasis in `compliance.service.ts` erzeugt Findings u. a. für:

- Platzhaltertext (`lorem ipsum`, `dummy text`)
- Passwort-Klartextmuster (`password: ...`)
- fehlenden Review-Abschnitt
- fehlenden Owner/Verantwortlichen

### 6.3 Findings und Reviews steuern

- Findings:
  - `PATCH /compliance/quality/findings/:id` mit `action: "RESOLVE"` oder `action: "REOPEN"`
- Reviews:
  - `POST /compliance/reviews` (Dokument + Reviewer)
  - `PATCH /compliance/reviews/:id` mit Status:
    - `PENDING`
    - `APPROVED`
    - `REJECTED`
    - `CHANGES_REQUESTED`

## 7) KPI-Sicht (`/api/analytics`)

`GET /api/analytics` aggregiert:

- `system`: Dokument-/Template-/User-Basiszahlen
- `automation`: Job-Rate, Suggestion-Übernahmen, Connector-Health
- `centralize`: Assistant-Usage, Knowledge-Coverage
- `comply`: offene Findings, Review-Zyklen, REQ-ID-Coverage

## 8) Quick Smoke Test nach Änderungen

1. `GET /api/health`
2. `GET /api/automation/connectors`
3. `POST /api/automation/jobs` (Testjob)
4. `GET /api/knowledge`
5. `POST /api/assistant/query`
6. `POST /api/compliance/quality/check`
7. `GET /api/analytics`

Wenn einer dieser Schritte fehlschlägt, zuerst Header (`Authorization`, `X-Tenant-ID`) und Queue-Konfiguration prüfen.
