# Automate / Centralize / Comply Runbook

Diese Runbook-Seite dokumentiert die zuletzt ausgebauten Subsysteme rund um:

- **Automate** (Generierungsjobs, Connectoren, Vorschläge)
- **Centralize** (Knowledge Nodes, globale Suche, Assistant-Zitate)
- **Comply** (Schemata, Traceability, Quality Findings, Reviews)

Die Inhalte sind gegen den aktuellen Quellcode validiert (`backend/src/index.ts`, `backend/src/routes/*`, `backend/src/services/*`).

---

## 1) Architektur-Überblick

Die relevanten Backend-Routen sind unter diesen Prefixes gemountet:

- `/api/automation`
- `/api/compliance`
- `/api/knowledge`
- `/api/search`
- `/api/assistant`

**Auth/Tenant-Kontext:**  
Die oben genannten Endpunkte laufen mit Auth + Tenant-Middleware. Im Frontend wird der Tenant über `X-Tenant-ID` gesetzt.

---

## 2) Öffentliche Interfaces (API)

### 2.1 Automation API (`/api/automation`)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/connectors` | Tenant- und globale Connectoren laden |
| POST | `/connectors` | Connector anlegen |
| PATCH | `/connectors/:id` | Connector aktiv/inaktiv setzen |
| GET | `/jobs` | Generierungsjobs inkl. Suggestions/Findings laden |
| POST | `/jobs` | Job anlegen |
| GET | `/jobs/:id` | Job-Detail laden |
| POST | `/jobs/:id/approve` | Job als `COMPLETED` markieren |
| POST | `/jobs/:id/retry` | Fehlgeschlagenen/abgebrochenen Job neu starten |
| POST | `/jobs/:id/cancel` | Job abbrechen |
| GET | `/suggestions` | Update-Vorschläge laden |
| PATCH | `/suggestions/:id` | Vorschlagstatus aktualisieren |

**Wichtige Constraints:**

- `POST /connectors` verlangt `name` + `type`.
- `PATCH /connectors/:id` erlaubt nur `isActive` (boolean).
- Globale Connectoren (`tenantId == null`) sind nicht per Tenant-API toggelbar.
- `retry` ist für `RUNNING`-Jobs gesperrt.
- `cancel` ist nur für `PENDING` und `RUNNING` erlaubt.
- Suggestions werden auf `APPLIED`/`DISMISSED` mit `resolvedAt` markiert.

---

### 2.2 Compliance API (`/api/compliance`)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/schemas` | Template-Schemata laden |
| POST | `/schemas` | Template-Schema anlegen |
| GET | `/annotations` | Annotationen (optional pro Dokument) laden |
| POST | `/annotations` | Annotation anlegen |
| GET | `/trace-links` | Trace Links laden |
| POST | `/trace-links` | Trace Link anlegen |
| GET | `/quality/findings` | Findings laden |
| PATCH | `/quality/findings/:id` | Finding lösen/wieder öffnen |
| POST | `/quality/check` | Quality Checks für ein Dokument ausführen |
| GET | `/reviews` | Review Requests laden |
| POST | `/reviews` | Review Request anlegen |
| PATCH | `/reviews/:id` | Review-Status/Kommentar ändern |

**Wichtige Constraints:**

- `POST /schemas` verlangt `name` + `schema`.
- `isGlobal` bei Schemata wird nur wirksam, wenn Actor-Role `ADMIN` oder kein Tenant-Kontext vorliegt.
- `POST /annotations` verlangt `documentId`, `key`, `value`.
- `POST /trace-links` verlangt `sourceType`, `sourceId`, `targetType`, `targetId`.
- `POST /quality/check` verlangt `documentId`.
- Zulässige Finding-Aktionen: `RESOLVE`, `REOPEN`.
- Review-Status muss in `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED` liegen.

---

### 2.3 Knowledge + Search (`/api/knowledge`, `/api/search`)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/api/knowledge` | Knowledge Nodes laden |
| POST | `/api/knowledge` | Knowledge Node anlegen |
| PATCH | `/api/knowledge/:id` | Knowledge Node ändern |
| DELETE | `/api/knowledge/:id` | Knowledge Node löschen |
| GET | `/api/search?q=...` | Globale Suche über Dokumente + Knowledge |

**Wichtige Constraints:**

- `POST /api/knowledge` verlangt `content` + `type`.
- Knowledge Node `type` wird serverseitig auf Uppercase normalisiert.
- Tenant-Sicherheit wird bei dokumentgebundenen und orphan Nodes geprüft.
- `/api/search` liefert `documents`, `knowledge`, `total`.
- Suchparameter `q` ist Pflicht, optional `type=documents|knowledge`.
- Bei Tenant-Filter in `/api/search` werden Knowledge-Treffer aus dokumentgebundenen Tenant-Daten gezogen (orphan Nodes ohne Dokumentbezug erscheinen dort i. d. R. nicht).

---

## 3) Workflow-Runbooks

Alle Beispiele unten nehmen an:

```bash
API_URL="http://localhost:3002/api"
TENANT_ID="<tenant-id>"
```

### 3.1 Automate: Connector -> Job -> Vorschlag

1. Connector anlegen:

```bash
curl -X POST "$API_URL/automation/connectors" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"name":"GitHub Core","type":"GIT","config":{"repo":"org/repo"}}'
```

2. Job starten:

```bash
curl -X POST "$API_URL/automation/jobs" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"intent":"UPDATE","title":"Weekly update draft","connectorId":"<connector-id>","documentId":"<doc-id>"}'
```

3. Jobs beobachten (`PENDING` -> `RUNNING` -> `COMPLETED|FAILED|CANCELLED`):

```bash
curl "$API_URL/automation/jobs" -H "X-Tenant-ID: $TENANT_ID"
```

4. Vorschlag übernehmen oder verwerfen:

```bash
curl -X PATCH "$API_URL/automation/suggestions/<suggestion-id>" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"status":"APPLIED","resolution":"Übernommen im Sprint-Review"}'
```

---

### 3.2 Comply: Quality Check -> Finding-Handling -> Review

1. Quality Check auf Dokument fahren:

```bash
curl -X POST "$API_URL/compliance/quality/check" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"documentId":"<doc-id>"}'
```

2. Findings prüfen und ggf. auflösen:

```bash
curl -X PATCH "$API_URL/compliance/quality/findings/<finding-id>" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"action":"RESOLVE","resolution":"Review-Abschnitt ergänzt"}'
```

3. Review anstoßen:

```bash
curl -X POST "$API_URL/compliance/reviews" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"documentId":"<doc-id>","reviewerId":"<user-id>","comments":"Bitte auf NIST Mapping prüfen"}'
```

---

### 3.3 Centralize: Knowledge Node -> Suche -> Assistant

1. Knowledge Node erstellen (optional dokumentgebunden):

```bash
curl -X POST "$API_URL/knowledge" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"content":"Backup läuft täglich 02:00 UTC","type":"PROCESS","documentId":"<doc-id>"}'
```

2. Global Search nutzen:

```bash
curl "$API_URL/search?q=backup&type=knowledge" \
  -H "X-Tenant-ID: $TENANT_ID"
```

3. Assistant abfragen und Citations prüfen:

```bash
curl -X POST "$API_URL/assistant/query" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"question":"Wie läuft der Backup-Prozess?","audience":"PRACTITIONER"}'
```

---

## 4) Betriebs-Setup (Queue + Worker)

### 4.1 Relevante Env-Variablen

| Variable | Wirkung |
| --- | --- |
| `AUTOMATION_QUEUE_PROVIDER` | `memory` oder `servicebus` |
| `AUTOMATION_QUEUE_AUTORUN` | Bei `true`: Jobs werden nach Create/Retry via Queue publiziert |
| `AUTOMATION_RUN_IMMEDIATE` | Bei `true`: Job wird direkt im API-Prozess verarbeitet |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Pflicht für Provider `servicebus` |
| `AZURE_SERVICE_BUS_QUEUE_NAME` | Pflicht für Provider `servicebus` |

### 4.2 Worker-Betrieb

```bash
cd backend

# Einzelnen Job ausführen
npm run automation:job -- <jobId>

# Queue-Consumer starten
npm run automation:worker
```

**Hinweis zum Memory-Provider:**  
`memory` ist pro Prozess lokal. Für verteilte Verarbeitung mehrere Prozesse/Pods ist `servicebus` erforderlich.

---

## 5) Developer-Fallstricke (Kurzfassung)

- **403 bei Connector-Update:** Häufig globaler Connector oder falscher Tenant.
- **Job bleibt in FAILED:** `error` Feld im Job prüfen, dann `retry` auslösen.
- **Service Bus aktiviert, aber keine Verarbeitung:** Connection String/Queue Name fehlt.
- **Review-Update schlägt fehl:** Ungültiger Status übergeben.
- **Keine Search-Knowledge-Treffer:** Prüfen, ob Node einem Tenant-Dokument zugeordnet ist und `q` gesetzt wurde.

Für detaillierte Fehlerbilder: `docs/TROUBLESHOOTING.md`.
