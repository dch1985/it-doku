# Automation, Centralize, and Compliance Runbook

This runbook documents the current operational behavior for the subsystems that changed most recently:

- Automate (`/api/automation`)
- Comply (`/api/compliance`)
- Centralize knowledge (`/api/knowledge`, `/api/assistant`)
- Cross-cutting analytics and search (`/api/analytics`, `/api/search`)

It is written from source code in `backend/src/routes`, `backend/src/services`, and the corresponding frontend hooks/pages.

## Source-of-truth codepaths

- Backend routes:
  - `backend/src/routes/automation.ts`
  - `backend/src/routes/compliance.ts`
  - `backend/src/routes/knowledge.ts`
  - `backend/src/routes/assistant.ts`
  - `backend/src/routes/analytics.ts`
  - `backend/src/routes/search.ts`
- Backend services:
  - `backend/src/services/automation.service.ts`
  - `backend/src/services/compliance.service.ts`
  - `backend/src/services/knowledge.service.ts`
  - `backend/src/services/assistant.service.ts`
- Queue behavior:
  - `backend/src/lib/automation.queue.ts`
  - `backend/src/workers/automation.worker.ts`
- Frontend workflows:
  - `frontend/src/pages/Automate.tsx`
  - `frontend/src/pages/Centralize.tsx`
  - `frontend/src/pages/Comply.tsx`
  - `frontend/src/hooks/useAutomation.ts`
  - `frontend/src/hooks/useCompliance.ts`
  - `frontend/src/hooks/useKnowledgeNodes.ts`
  - `frontend/src/hooks/useGlobalSearch.ts`
  - `frontend/src/hooks/useAnalytics.ts`

## Runtime prerequisites

### Local defaults

- Backend URL: `http://localhost:3002` (`backend/env.sample` sets `PORT=3002`)
- Frontend URL: `http://localhost:5173`
- Frontend API base: `VITE_API_URL=http://localhost:3002/api`

### Auth and tenant context

All runbook endpoints are behind auth + tenant middleware in normal operation.

Expected request headers:

- `Authorization: Bearer <access-token>`
- `X-Tenant-ID: <tenant-id>` or `X-Tenant-Slug: <tenant-slug>`

Dev shortcut:

- If `NODE_ENV=development` or `DEV_AUTH_ENABLED=true`, dev auth middleware can inject a demo user and tenant checks may be relaxed for local testing.

## Public interface map

| Subsystem | Route prefix | Main operations | Notes |
| --- | --- | --- | --- |
| Automate | `/api/automation` | connectors, jobs, suggestions | Job lifecycle includes retry/cancel/approve |
| Comply | `/api/compliance` | schemas, annotations, trace links, quality findings/check, reviews | Review and finding status transitions are validated server-side |
| Knowledge | `/api/knowledge` | list/create/update/delete knowledge nodes | Orphan nodes are tenant-scoped through metadata |
| Assistant | `/api/assistant` | conversations, query, traces | Answers are citation-driven from documents + knowledge nodes |
| Search | `/api/search` | global ranked search | `q` is required; optional `type` and `limit` |
| Analytics | `/api/analytics` | KPI payload for dashboards | Returns `system`, `automation`, `centralize`, `comply` blocks |

## Workflow: Automate pipeline

### 1) Create and maintain connectors

Create connector:

```bash
curl -X POST "http://localhost:3002/api/automation/connectors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"GitHub Core Repo","type":"GIT","config":{"repo":"org/repo"}}'
```

Constraints:

- `name` and `type` are required.
- `type` is normalized to uppercase.
- `PATCH /connectors/:id` only supports `{ "isActive": boolean }`.
- Global connectors (`tenantId == null`) cannot be toggled by tenant users.

### 2) Start generation jobs

```bash
curl -X POST "http://localhost:3002/api/automation/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Weekly update draft",
    "intent":"UPDATE",
    "documentId":"<document-id>",
    "connectorId":"<connector-id>",
    "payload":{"scope":"weekly"}
  }'
```

Supported intents seen in UI/workflow:

- `CREATE`
- `UPDATE`
- `SUMMARY`
- `QUALITY`

### 3) Understand execution mode

Execution is controlled by env flags:

- `AUTOMATION_QUEUE_AUTORUN=true` -> job is published to queue provider.
- `AUTOMATION_RUN_IMMEDIATE=true` -> job is processed immediately in request flow.
- `AUTOMATION_QUEUE_PROVIDER=memory|servicebus`
  - `servicebus` additionally requires:
    - `AZURE_SERVICE_BUS_CONNECTION_STRING`
    - `AZURE_SERVICE_BUS_QUEUE_NAME`

### 4) Operate job lifecycle

Common commands:

- List jobs: `GET /api/automation/jobs`
- Inspect one: `GET /api/automation/jobs/:id`
- Retry: `POST /api/automation/jobs/:id/retry`
- Cancel: `POST /api/automation/jobs/:id/cancel`
- Approve: `POST /api/automation/jobs/:id/approve`

Status notes from service logic:

- Retry is blocked while status is `RUNNING`.
- Cancel only works in `PENDING` or `RUNNING`.
- Successful processing stores `resultDraft` and generated quality findings.

### 5) Resolve suggestions and findings

- Suggestions: `GET /api/automation/suggestions`, `PATCH /api/automation/suggestions/:id`
- Suggested statuses: `OPEN`, `APPLIED`, `DISMISSED`
- Marking a suggestion as applied/dismissed sets `resolvedAt`.

## Workflow: Compliance lifecycle

### 1) Template schemas

- `GET /api/compliance/schemas`
- `POST /api/compliance/schemas`

Payload must include `name` and `schema`.
`format` is normalized to uppercase (default `MARKDOWN`).

### 2) Annotations and trace links

- `GET/POST /api/compliance/annotations`
- `GET/POST /api/compliance/trace-links`

Required fields:

- Annotation: `documentId`, `key`, `value`
- Trace link: `sourceType`, `sourceId`, `targetType`, `targetId`

### 3) Quality checks and findings

- Run checks: `POST /api/compliance/quality/check` with `documentId`
- List findings: `GET /api/compliance/quality/findings`
- Update finding: `PATCH /api/compliance/quality/findings/:id` with action `RESOLVE` or `REOPEN`

Current check heuristics (code-backed):

- Placeholder text (`lorem ipsum`, `dummy text`) -> warning
- Plain password pattern (`password: ...`) -> error
- Missing review wording -> info finding
- Missing owner/verantwortlich wording -> governance info

### 4) Review workflow

- List/create: `GET/POST /api/compliance/reviews`
- Update status/comments: `PATCH /api/compliance/reviews/:id`

Allowed statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

## Workflow: Centralize knowledge and assistant

### Knowledge nodes

- `GET /api/knowledge`
- `POST /api/knowledge`
- `PATCH /api/knowledge/:id`
- `DELETE /api/knowledge/:id`

Payload notes:

- `content` and `type` are required on create.
- `type` is normalized to uppercase.
- `documentId` is optional; for orphan nodes, tenant ownership is stored in metadata.

### Assistant

- `GET /api/assistant/conversations`
- `POST /api/assistant/query`
- `GET /api/assistant/traces`

Response behavior:

- Answers are built from matching documents + knowledge nodes.
- Citations include source type (`document` or `knowledge`) and excerpt snippets.
- Audience defaults to `PRACTITIONER` unless explicitly set to `BEGINNER` or `EXPERT`.

## Workflow: Search and analytics

### Search

Endpoint: `GET /api/search`

Query params:

- `q` (required)
- `type` (optional: `documents` or `knowledge`)
- `limit` (optional, default 20)

Search ranks results by relevance score and includes highlighted/snippet context.

### Analytics

Endpoint: `GET /api/analytics`

Response sections used by the dashboards:

- `system`
- `automation`
- `centralize`
- `comply`

## Operational commands

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd ../frontend
npm run dev

# Process one job by ID
cd ../backend
npm run automation:job -- <jobId>

# Start long-running queue worker
npm run automation:worker
```

## Common pitfalls

- **Wrong backend port in local docs/scripts**: use `3002` unless explicitly overridden.
- **Missing tenant header**: non-dev requests fail without `X-Tenant-ID`/`X-Tenant-Slug`.
- **Service Bus misconfiguration**: setting `AUTOMATION_QUEUE_PROVIDER=servicebus` without connection string + queue name fails queue operations.
- **Connector toggle forbidden**: global connectors cannot be patched by tenant users.
- **Unexpectedly empty analytics/search**: verify auth token + tenant context first; both are tenant-scoped in normal operation.
