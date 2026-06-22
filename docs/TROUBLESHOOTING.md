# Troubleshooting Guide

This guide is aligned with the current backend codepaths in `backend/src` and focuses on the subsystems that changed most recently: **Automation**, **Knowledge**, **Compliance**, **Analytics**, and **Global Search**.

---

## 1) Quick diagnostics first

```bash
# API liveness
curl -s http://localhost:3002/api/health

# Verify auth context (dev mode can auto-inject demo user)
curl -s http://localhost:3002/api/auth/me

# Optional: check tenant-scoped analytics
curl -s http://localhost:3002/api/analytics \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>"
```

If health fails, fix runtime/environment issues before debugging feature-specific routes.

---

## 2) Database connection or firewall errors

### Symptoms

- Backend logs contain SQL connectivity errors (`P1001`, login denied, firewall denied).
- Many API routes return 500 quickly.

### Fix

1. Confirm `DATABASE_URL` in `backend/.env`.
2. If using Azure SQL, allow the runtime IP in SQL firewall settings.
3. Re-run:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```
4. Restart backend: `npm run dev`

---

## 3) `Tenant identifier required` (400)

### Why it happens

`tenantMiddleware` requires tenant context for tenant-aware routes in non-dev mode.

### Fix

Send one of:

- `X-Tenant-ID: <tenant-id>`
- `X-Tenant-Slug: <tenant-slug>`

Alternative (development only):

- `NODE_ENV=development` or `DEV_AUTH_ENABLED=true` enables relaxed tenant/auth behavior for local testing.

---

## 4) Automation jobs stay in `PENDING`

### Why it happens

`automationService.createJob` only auto-processes jobs when one of these is true:

- `AUTOMATION_RUN_IMMEDIATE=true` (inline processing), or
- `AUTOMATION_QUEUE_AUTORUN=true` (publish to queue and consume with worker)

If both are false, jobs are created but not executed.

### Fix options

#### Option A: Immediate mode (local/dev)

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

#### Option B: Queue mode (recommended for production)

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=<connection-string>
AZURE_SERVICE_BUS_QUEUE_NAME=<queue-name>
```

Then run a worker:

```bash
cd backend
npm run automation:worker
```

---

## 5) Service Bus mode fails at startup or on publish

### Symptom

Error similar to:

- `Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

### Fix

When `AUTOMATION_QUEUE_PROVIDER=servicebus`, both variables are mandatory:

- `AZURE_SERVICE_BUS_CONNECTION_STRING`
- `AZURE_SERVICE_BUS_QUEUE_NAME`

Also ensure network access/credentials are valid for the configured queue.

---

## 6) Connector toggle/update fails (`403` or `404`)

### Why it happens

`PATCH /api/automation/connectors/:id` enforces ownership:

- Global connectors (`tenantId == null`) cannot be changed by tenant users.
- Connector from another tenant is blocked.
- Unknown connector returns 404.

### Fix

- Toggle only tenant-owned connectors.
- Create tenant-local connectors via `POST /api/automation/connectors` before toggling.

---

## 7) Compliance review request creation fails

### Common causes

`POST /api/compliance/reviews` requires:

- `documentId`
- `reviewerId`
- authenticated requester (`req.user.id`)

Service-level checks can also fail if:

- document does not exist
- reviewer user does not exist
- document tenant does not match current tenant context

### Fix

1. Validate `documentId` and `reviewerId` are real IDs.
2. Confirm requester is authenticated.
3. Ensure tenant header matches the document tenant.

---

## 8) Quality checks fail or return no findings

### Common causes

- `POST /api/compliance/quality/check` without `documentId` returns 400.
- Invalid `documentId` returns "Dokument nicht gefunden".
- Existing findings were cleared and recalculated (expected behavior).

### Fix

```bash
curl -X POST http://localhost:3002/api/compliance/quality/check \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>" \
  -d '{"documentId":"<document-id>"}'
```

---

## 9) Search endpoint validation errors

### Symptoms

- `GET /api/search` returns 400 with:
  - `Query parameter "q" is required`, or
  - `Query cannot be empty`

### Fix

Provide a non-empty query:

```bash
curl -s "http://localhost:3002/api/search?q=runbook&type=documents&limit=20" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>"
```

---

## 10) Frontend can’t reach backend

### Checks

1. Backend is running on `http://localhost:3002`.
2. Frontend `frontend/.env` has:
   ```env
   VITE_API_URL=http://localhost:3002/api
   ```
3. `FRONTEND_URL` in backend env matches the frontend origin for CORS (default `http://localhost:5173`).

---

## Escalation checklist (before opening an issue)

- [ ] `GET /api/health` works
- [ ] `GET /api/auth/me` returns a user
- [ ] Tenant header is present for tenant-scoped routes
- [ ] Automation mode flags match intended processing pattern
- [ ] Worker is running when queue mode is enabled
- [ ] Relevant IDs (`documentId`, `reviewerId`, `connectorId`) are valid
