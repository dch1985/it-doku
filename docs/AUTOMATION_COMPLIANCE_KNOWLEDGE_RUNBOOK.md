# Automation, Compliance & Knowledge Runbook

This runbook documents the production-facing workflows behind the **Automate**, **Comply**, and **Centralize** pages.
It focuses on behavior that is implemented in code today.

## Scope and intent

- Keep AI-generated documentation jobs operational and observable.
- Keep compliance evidence (annotations, trace links, findings, reviews) auditable.
- Keep tenant-scoped knowledge nodes usable for search and assistant citations.

## Primary codepaths

### Backend routes

- `backend/src/routes/automation.ts` → `/api/automation/*`
- `backend/src/routes/compliance.ts` → `/api/compliance/*`
- `backend/src/routes/knowledge.ts` → `/api/knowledge/*`
- `backend/src/routes/assistant.ts` → `/api/assistant/*`

### Backend services

- `backend/src/services/automation.service.ts`
- `backend/src/services/compliance.service.ts`
- `backend/src/services/knowledge.service.ts`
- `backend/src/lib/automation.queue.ts`
- `backend/src/workers/automation.worker.ts`

### Frontend integration

- `frontend/src/hooks/useAutomation.ts` + `frontend/src/pages/Automate.tsx`
- `frontend/src/hooks/useCompliance.ts` + `frontend/src/pages/Comply.tsx`
- `frontend/src/hooks/useKnowledgeNodes.ts` + `frontend/src/pages/Centralize.tsx`
- `frontend/src/hooks/useAssistant.ts` (citations from docs + knowledge nodes)

## Shared API constraints

- All routes above are mounted under `/api/*` in `backend/src/index.ts`.
- They require auth middleware (`authenticate` or `devAuthenticate` in dev mode).
- They run through `tenantMiddleware`:
  - Preferred headers: `X-Tenant-ID` or `X-Tenant-Slug`
  - Without tenant header, requests fail in non-dev mode (`400 Tenant identifier required`).

Example header set:

```http
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
Content-Type: application/json
```

## Public interfaces

### Automation (`/api/automation`)

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| GET | `/connectors` | List tenant + global connectors | Includes global (`tenantId=null`) connectors |
| POST | `/connectors` | Create connector | Requires `name`, `type`; `type` is uppercased |
| PATCH | `/connectors/:id` | Enable/disable connector | `isActive` boolean required; global connectors cannot be changed |
| GET | `/jobs` | List jobs with suggestions/findings | Ordered by `createdAt desc` |
| POST | `/jobs` | Create generation job | Optional: `intent`, `documentId`, `connectorId`, `payload`, `title` |
| GET | `/jobs/:id` | Get job details | Tenant ownership check |
| POST | `/jobs/:id/retry` | Reset failed/cancelled job to pending | Blocked while job is `RUNNING` |
| POST | `/jobs/:id/cancel` | Cancel pending/running job | Only allowed in `PENDING` or `RUNNING` |
| POST | `/jobs/:id/approve` | Mark completed/approved | Sets `status=COMPLETED` and `completedAt` |
| GET | `/suggestions` | List update suggestions | Tenant-scoped via linked generation job |
| PATCH | `/suggestions/:id` | Update suggestion status | `status` is uppercased; `APPLIED`/`DISMISSED` set `resolvedAt` |

### Compliance (`/api/compliance`)

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| GET | `/schemas` | List template schemas | Returns tenant + global schemas |
| POST | `/schemas` | Create schema | `name` + `schema` required; `format` uppercased |
| GET | `/annotations` | List annotations | Optional `documentId` filter |
| POST | `/annotations` | Create annotation | Requires `documentId`, `key`, `value`; key is uppercased |
| GET | `/trace-links` | List trace links | Optional `documentId` filter |
| POST | `/trace-links` | Create trace link | Source/target types uppercased; default relationship `RELATES_TO` |
| GET | `/quality/findings` | List findings | Optional `documentId` filter |
| PATCH | `/quality/findings/:id` | Resolve/reopen finding | Action: `RESOLVE` or `REOPEN` |
| POST | `/quality/check` | Run quality checks | Requires `documentId`; rewrites manual findings for that document |
| GET | `/reviews` | List review requests | Optional `documentId` filter |
| POST | `/reviews` | Create review request | Requires `documentId`, `reviewerId` |
| PATCH | `/reviews/:id` | Update review status/comments | Status must be one of `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED` |

### Knowledge (`/api/knowledge`)

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| GET | `/` | List knowledge nodes | Optional `documentId` filter |
| POST | `/` | Create knowledge node | Requires `content`, `type`; type is uppercased |
| PATCH | `/:id` | Update node | Tenant ownership checks enforced |
| DELETE | `/:id` | Delete node | Tenant ownership checks enforced |

## Workflow runbooks

### 1) Documentation automation flow

1. Create or verify a connector (`POST /api/automation/connectors`).
2. Start a job (`POST /api/automation/jobs`) with an `intent` (`CREATE`, `UPDATE`, `SUMMARY`, `QUALITY` in current UI).
3. Poll jobs (`GET /api/automation/jobs`) until status moves out of `PENDING`/`RUNNING`.
4. For failed jobs, inspect `error`, then retry (`POST /api/automation/jobs/:id/retry`).
5. Review generated suggestions and set status (`PATCH /api/automation/suggestions/:id`).
6. Optionally mark completed jobs as approved (`POST /api/automation/jobs/:id/approve`).

### 2) Compliance evidence flow

1. Define schema baseline (`POST /api/compliance/schemas`).
2. Add annotations for requirement/control IDs (`POST /api/compliance/annotations`).
3. Add trace links between source and target artifacts (`POST /api/compliance/trace-links`).
4. Run quality checks on a document (`POST /api/compliance/quality/check`).
5. Resolve or reopen findings (`PATCH /api/compliance/quality/findings/:id`).
6. Trigger review requests and track lifecycle (`POST/PATCH /api/compliance/reviews`).

### 3) Knowledge coverage flow

1. Create knowledge nodes (`POST /api/knowledge`) with optional `documentId`.
2. Keep node/document links current (`PATCH /api/knowledge/:id`) to avoid orphaned context.
3. Verify assistant traces (`GET /api/assistant/traces`) include useful citations.

## Automation processing modes (operations)

Environment flags are read in `automation.service.ts` and `automation.queue.ts`.

### Mode A: immediate processing (local default)

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

- Jobs are processed synchronously during job creation/retry.
- No separate worker process required.

### Mode B: queued in same process

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_QUEUE_PROVIDER=memory
```

- Service publishes queue messages and consumes them via in-process subscriber.
- Useful for asynchronous behavior without external queue infrastructure.

### Mode C: external queue / worker process

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=<connection-string>
AZURE_SERVICE_BUS_QUEUE_NAME=<queue-name>
```

Start worker listener:

```bash
cd backend
npm run automation:worker
```

Process one job manually:

```bash
cd backend
npm run automation:job -- <jobId>
```

## Troubleshooting and common pitfalls

### Jobs stay in `PENDING`

Likely cause: both immediate and autorun modes are disabled and no worker is consuming queue messages.

Checklist:

1. Check env flags (`AUTOMATION_RUN_IMMEDIATE`, `AUTOMATION_QUEUE_AUTORUN`).
2. If using provider `servicebus`, verify queue credentials and worker process status.
3. Retry the job after fixing mode/worker (`POST /api/automation/jobs/:id/retry`).

### `403` when toggling a connector

Likely cause: connector is global (`tenantId=null`) or belongs to another tenant.

What to verify:

- Connector returned by `GET /api/automation/connectors`.
- Current tenant header (`X-Tenant-ID`).

### Quality check results appear to “reset”

`runQualityChecks` removes previous manual findings (`generationJobId=null`) for the same document before writing new findings.  
This is expected behavior.

### Knowledge node not visible to a tenant

For nodes without `documentId`, tenant ownership is inferred from `metadata.tenantId`.  
If metadata tenant does not match request tenant, list/update/delete can be filtered or rejected.

### Review update rejected

Review status must match one of:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

Any other value returns `400`.
