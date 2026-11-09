# Troubleshooting Guide

This guide focuses on issues in the current Automate / Centralize / Comply
workflows and their backend integrations.

## 1) Frontend cannot reach backend

### Symptoms

- `Failed to fetch` in multiple pages
- Tenant selector loads, but Automate/Centralize/Comply fail

### Root cause

Mixed local defaults exist in frontend code (`3001` and `3002`) when
`VITE_API_URL` is missing.

### Fix

Set an explicit API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:3002/api
```

Then restart frontend dev server.

---

## 2) "Tenant identifier required" / empty tenant-scoped results

### Symptoms

- `/api/automation`, `/api/knowledge`, `/api/compliance`, `/api/search`,
  `/api/analytics`, or `/api/assistant` return auth/tenant errors.

### Root cause

These routes run behind auth + tenant middleware and require tenant context.

### Fix

- In frontend, select a tenant.
- In API clients, send header:

```http
X-Tenant-ID: <tenantId>
Authorization: Bearer <token>
```

---

## 3) Automation jobs stay `PENDING`

### Symptoms

- Jobs are created but never move to `RUNNING`/`COMPLETED`.

### Root cause

Execution mode flags are not aligned with deployment setup.

### Fix

Pick one mode:

1. **Immediate mode (local/dev):**
   - `AUTOMATION_RUN_IMMEDIATE=true`
2. **Queue autorun:**
   - `AUTOMATION_QUEUE_AUTORUN=true`
3. **Manual/worker mode:**
   - both flags `false`, then process jobs manually:
     `npm run automation:job -- <jobId>` or run `npm run automation:worker`

If using queue mode in production, prefer:

```env
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=...
AZURE_SERVICE_BUS_QUEUE_NAME=...
```

---

## 4) Worker runs but no jobs are processed

### Symptoms

- Worker is running, but new jobs remain pending.

### Root cause

`AUTOMATION_QUEUE_PROVIDER=memory` is process-local and non-durable.
Messages are not shared across different processes/instances.

### Fix

- Use `AUTOMATION_RUN_IMMEDIATE=true` for local single-process setups, or
- Switch to `AUTOMATION_QUEUE_PROVIDER=servicebus` for cross-process processing.

---

## 5) "Connector konnte nicht aktualisiert werden"

### Symptoms

- Toggling connector active/inactive fails on Automate page.

### Root cause

Global connectors (`tenantId = null`) cannot be modified via tenant UI.

### Fix

- Only toggle tenant-owned connectors.
- For global connectors, update through system-level administration.

---

## 6) Knowledge node appears in Centralize but not in global search

### Symptoms

- Node is visible in `/api/knowledge` but not in `/api/search?type=knowledge`.

### Root cause

Tenant-filtered search currently scopes knowledge via
`knowledgeNode.document.tenantId`. Orphan nodes (without `documentId`) are not
reliably discoverable in tenant-filtered search.

### Workaround

- Link important nodes to a tenant document, or
- Search in Centralize knowledge management directly.

---

## 7) Review request creation fails

### Symptoms

- `POST /api/compliance/reviews` returns 400/403/404.

### Common causes

- `documentId` missing
- `reviewerId` missing or invalid
- Request user not authenticated
- Document belongs to a different tenant

### Fix

- Ensure selected document + reviewer exist in same tenant scope.
- Verify auth token and `X-Tenant-ID`.

---

## 8) Quality check does not return expected findings

### Important behavior

`POST /api/compliance/quality/check` evaluates plain text generated from
document HTML and checks heuristics such as:

- placeholder text (`lorem ipsum`, `dummy text`)
- plaintext password patterns
- missing review/freigabe wording
- missing owner/verantwortlich wording

If findings are missing, verify the stored document content (not just editor
preview) and rerun the check.

---

## 9) Azure SQL firewall blocks backend

### Symptoms

Errors similar to:

```txt
Cannot open server '<server>' requested by the login.
Client with IP address '<ip>' is not allowed to access the server.
```

### Fix

1. Open Azure SQL Server networking settings.
2. Add current client IP (or allow trusted Azure services where appropriate).
3. Wait a few minutes for rule propagation.

Quick health checks:

```bash
curl http://localhost:3002/api/health
```

---

## 10) Quick diagnostic checklist

```bash
# Backend health
curl -s http://localhost:3002/api/health

# Tenant-aware analytics
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  http://localhost:3002/api/analytics

# Automation jobs
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  http://localhost:3002/api/automation/jobs
```
