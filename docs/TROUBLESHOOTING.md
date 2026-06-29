# Troubleshooting Guide

This page focuses on current production/dev issues around tenant-aware APIs, automation workers, and compliance workflows.

## Quick triage checklist

1. Verify backend is running: `curl http://localhost:3002/api/health`
2. Verify frontend API base: `VITE_API_URL` in `frontend/.env`
3. For protected routes, send:
   - `Authorization: Bearer <token>`
   - `X-Tenant-ID: <tenant-id>` (or `X-Tenant-Slug`)
4. Verify selected automation mode in backend env:
   - `AUTOMATION_RUN_IMMEDIATE`
   - `AUTOMATION_QUEUE_AUTORUN`
   - `AUTOMATION_QUEUE_PROVIDER`

## Problem: `Tenant identifier required`

### Symptom

- Backend responds `400` with message:
  - `Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header.`

### Cause

- Tenant middleware enforces tenant context for most non-public endpoints.

### Fix

```bash
curl "$API_BASE/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

### Notes

- In dev mode (`NODE_ENV=development` or `DEV_AUTH_ENABLED=true`) tenantless requests may pass for some routes, but do not rely on this in production tests.

## Problem: Automation jobs stay `PENDING`

### Symptom

- `GET /api/automation/jobs` shows jobs stuck in `PENDING`.

### Typical causes

1. Both flags disabled:
   - `AUTOMATION_RUN_IMMEDIATE=false`
   - `AUTOMATION_QUEUE_AUTORUN=false`
2. Queue provider is `servicebus` but no worker is running.
3. Service Bus env vars are missing.

### Fix paths

#### Option A: Immediate local processing

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

#### Option B: Queue + worker

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=...
AZURE_SERVICE_BUS_QUEUE_NAME=...
```

Then start worker:

```bash
cd backend
npm run automation:worker
```

### Incident recovery

```bash
cd backend
npm run automation:job -- <jobId>
```

## Problem: Connector toggle fails with `Globale Connectoren können nicht angepasst werden`

### Symptom

- `PATCH /api/automation/connectors/:id` returns `403`.

### Cause

- Global connectors (`tenantId == null`) are intentionally immutable from tenant scope.

### Fix

- Create/manage a tenant-scoped connector for runtime toggling.
- Do not expect global connectors to be toggleable in the tenant UI.

## Problem: Search returns documents but no knowledge nodes

### Symptom

- `/api/search?q=...` returns empty `knowledge` array while documents exist.

### Likely causes

1. Knowledge nodes are not assigned to tenant-owned documents.
2. Orphan nodes were created without tenant metadata.
3. Query text does not match `content`, `tags`, `metadata`, or node type.

### Fix

1. Check nodes:

```bash
curl "$API_BASE/knowledge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

2. Update or recreate nodes with correct document assignment and tenant context.
3. Re-run search using `type=knowledge` for focused debugging.

## Problem: Compliance quality checks create no useful findings

### Symptom

- `POST /api/compliance/quality/check` returns empty findings or only low-signal hints.

### Cause

- Current checks are rule-based and look for explicit patterns, e.g.:
  - placeholder text (`lorem ipsum`, `dummy text`)
  - plain-text password patterns
  - missing review/owner wording

### Fix

- Ensure document contains auditable sections (review process, owner, concrete controls).
- Re-run:

```bash
curl -X POST "$API_BASE/compliance/quality/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"<document-id>"}'
```

## Problem: `Failed to load documents` or SQL connectivity errors

### Symptom

- Errors similar to firewall/network access denial for SQL Server.

### Fix options

1. Add firewall rule in Azure SQL for current client IP.
2. Confirm `DATABASE_URL` is reachable from backend runtime.
3. Validate DB connectivity before frontend debugging.

### Verification

```bash
curl http://localhost:3002/api/health
curl "$API_BASE/documents" -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT_ID"
```

## Problem: Frontend cannot reach backend

### Checks

- `frontend/.env` contains correct `VITE_API_URL`
- Backend `FRONTEND_URL` allows frontend origin
- Browser network tab does not show CORS rejection
- Backend route prefix is `/api/*` (do not call bare `/analytics`, etc.)
