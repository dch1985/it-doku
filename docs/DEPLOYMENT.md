# Deployment Guide

This runbook focuses on the currently active Automate/Centralize/Comply stack and its queue-dependent backend behavior.

## 1) Pre-deployment checklist

### Backend

- [ ] `npx prisma migrate deploy`
- [ ] `npx prisma generate`
- [ ] Production `DATABASE_URL` reachable from runtime network
- [ ] `FRONTEND_URL` set to your deployed frontend origin
- [ ] Queue mode selected intentionally (see section 3)
- [ ] If using `servicebus`, set both `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME`

### Frontend

- [ ] `VITE_API_URL` points to backend `/api`
- [ ] `VITE_AZURE_CLIENT_ID` / `VITE_AZURE_TENANT_ID` set for non-dev auth flows
- [ ] `npm run build` succeeds in `frontend/`

---

## 2) Environment variable matrix (backend)

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=sqlserver://...
FRONTEND_URL=https://your-frontend-domain.com

# Auth / AI integrations
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_OPENAI_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01
GITHUB_TOKEN=

# Automation execution
AUTOMATION_QUEUE_PROVIDER=memory
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=false
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_SERVICE_BUS_QUEUE_NAME=
```

Frontend:

```env
VITE_API_URL=https://your-backend-domain/api
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=
VITE_DEV_AUTH_ENABLED=false
```

---

## 3) Queue execution modes

### Mode A: immediate execution (single-instance / local-like)

Use when you want jobs to run directly in the API process.

```env
AUTOMATION_QUEUE_PROVIDER=memory
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
```

### Mode B: in-memory queue with subscriber in API process

Use when jobs should be published and consumed by the same process asynchronously.

```env
AUTOMATION_QUEUE_PROVIDER=memory
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
```

### Mode C: Azure Service Bus queue

Use for multi-instance production queueing.

```env
AUTOMATION_QUEUE_PROVIDER=servicebus
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AZURE_SERVICE_BUS_CONNECTION_STRING=...
AZURE_SERVICE_BUS_QUEUE_NAME=...
```

Start a worker listener:

```bash
cd backend
npm run automation:worker
```

You can also process a single job directly:

```bash
cd backend
npm run automation:job -- <jobId>
```

---

## 4) Post-deploy smoke tests

Run from a trusted terminal with appropriate auth/tenant headers:

```bash
# 1) health
curl -sS https://<backend>/api/health

# 2) analytics (tenant-aware route)
curl -sS -H "X-Tenant-ID: <tenant-id>" https://<backend>/api/analytics

# 3) automation job creation
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{"intent":"QUALITY","title":"Deployment smoke job"}' \
  https://<backend>/api/automation/jobs

# 4) compliance quality check
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{"documentId":"<document-id>"}' \
  https://<backend>/api/compliance/quality/check
```

Expected signals:

- `/api/health` returns `status: "OK"`
- analytics returns `system`, `automation`, `centralize`, `comply`
- created jobs move from `PENDING/RUNNING` to `COMPLETED` (or explicit `FAILED` with error)

---

## 5) High-signal operational checks

- If jobs stay `PENDING`, queue mode and worker wiring are misaligned.
- If analytics/search/compliance endpoints return tenant errors, verify `X-Tenant-ID` and tenant membership.
- If using Service Bus, missing queue credentials will fail publish/subscribe at runtime.

For incident playbooks and failure-specific fixes, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
