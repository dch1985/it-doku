# Troubleshooting Guide

This guide covers high-frequency failures in the current Automate/Centralize/Comply implementation.

## Quick triage commands

```bash
# Backend health (local default)
curl -sS http://localhost:3002/api/health

# Tenant-aware analytics (requires tenant header in most setups)
curl -sS -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/analytics

# Inspect latest automation jobs
curl -sS -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/automation/jobs
```

---

## 1) `Tenant identifier required` (HTTP 400)

### Symptom

Routes using `tenantMiddleware` fail with:

- `Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header.`

### Why it happens

Tenant-aware routes require `X-Tenant-ID` or `X-Tenant-Slug` unless dev-auth mode bypass applies.

### Fix

- Send one of these headers:
  - `X-Tenant-ID: <tenant-uuid>`
  - `X-Tenant-Slug: <tenant-slug>`
- Ensure the current user is a member of that tenant.

---

## 2) Automation jobs stay `PENDING`

### Symptom

`POST /api/automation/jobs` succeeds, but status does not move to `RUNNING`/`COMPLETED`.

### Why it happens

Execution flags are misaligned:

- `AUTOMATION_QUEUE_AUTORUN=false`
- `AUTOMATION_RUN_IMMEDIATE=false`

In this combination, jobs are created but not executed automatically.

### Fix options

1. Enable immediate execution:
   ```env
   AUTOMATION_RUN_IMMEDIATE=true
   ```
2. Enable queue autorun:
   ```env
   AUTOMATION_QUEUE_AUTORUN=true
   ```
3. Run manually:
   ```bash
   cd backend
   npm run automation:job -- <jobId>
   ```

---

## 3) Service Bus mode errors on publish/subscribe

### Symptom

Queue operations fail with messages similar to:

- `Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

### Why it happens

`AUTOMATION_QUEUE_PROVIDER=servicebus` is set, but required Service Bus env vars are missing.

### Fix

Set all required values:

```env
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=...
AZURE_SERVICE_BUS_QUEUE_NAME=...
```

Then start a worker:

```bash
cd backend
npm run automation:worker
```

---

## 4) Knowledge nodes do not appear in global search

### Symptom

A node exists in `/api/knowledge`, but `/api/search?q=...&type=knowledge` does not return it.

### Why it happens

Tenant-filtered search only includes knowledge nodes linked through a document tenant relation.
Nodes without `documentId` are not reliably discoverable in tenant-filtered `/api/search`.

### Fix

- Link the node to a document in the same tenant, or
- Query `/api/knowledge` directly when managing orphan nodes.

---

## 5) Review workflow errors (`/api/compliance/reviews`)

### Common cases

- `Reviewer wurde nicht gefunden` (404)
- `Zugriff auf dieses Dokument ist nicht erlaubt` (403)
- `Ungültiger Review-Status` (400)

### Fix checklist

- Validate `reviewerId` against `/api/users` in the same tenant.
- Ensure `documentId` belongs to the active tenant.
- Use only valid statuses: `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`.

---

## 6) Assistant answers without citations

### Symptom

Assistant responds, but with no source references.

### Why it happens

No relevant documents or knowledge nodes matched the question for the active tenant.

### Fix

- Add or update tenant documents (`/api/documents`)
- Add linked knowledge nodes (`/api/knowledge`)
- Retry query with more specific terms matching titles/content/tags

---

## 7) Frontend talks to wrong backend port in development

### Symptom

Some UI features fail while backend is running on `3002`.

### Why it happens

`VITE_API_URL` is missing; some frontend modules fall back to `3001` while others default to `3002`.

### Fix

Set an explicit value in `frontend/.env`:

```env
VITE_API_URL=http://localhost:3002/api
```

Restart frontend dev server after changing env variables.

---

## 8) Azure SQL firewall blocks backend queries

### Symptom

Errors like:

- `Client with IP address ... is not allowed to access the server.`
- Prisma `P1001`

### Fix

1. Add your current IP in Azure SQL firewall.
2. Confirm `DATABASE_URL` is correct.
3. Re-run:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

For repeated local changes, consider automating firewall updates with Azure CLI scripts.
