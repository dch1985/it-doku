# Deployment Guide

## 1) Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Configure required environment variables (see sections below)
- [ ] Confirm database connectivity from runtime environment
- [ ] Verify auth + tenant headers in staging
- [ ] Decide automation execution mode (immediate vs queue)

### Frontend

- [ ] Set `VITE_API_URL` to backend `/api` base URL
- [ ] Configure Azure AD B2C client/tenant values (if used)
- [ ] Build frontend: `npm run build`
- [ ] Validate key pages: Automate, Centralize, Comply

---

## 2) Environment Variables

### Backend Production Baseline

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=sqlserver://...
FRONTEND_URL=https://your-frontend-domain.com

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

# Automation runtime behavior
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_PROVIDER=memory

# Required only when provider=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_SERVICE_BUS_QUEUE_NAME=
```

### Frontend Production

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## 3) Automation Execution Modes (Runbook)

`backend/src/services/automation.service.ts` supports these runtime modes:

| Mode | Required flags | Processing behavior | Operational note |
|---|---|---|---|
| Immediate | `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false` | `POST /api/automation/jobs` processes in API process | Simplest setup for local/dev |
| Queued (memory) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory` | Job is published to in-process subscriber | Good for single-process staging |
| Queued (servicebus) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=servicebus`, plus Service Bus vars | Job is sent/received via Azure Service Bus | Use when scaling to separate worker instances |

> If both flags are `false`, jobs stay `PENDING` until manual processing.

### Worker Commands

```bash
cd backend

# Process one explicit job ID
npm run automation:job -- <jobId>

# Start long-running queue listener
npm run automation:worker
```

---

## 4) Platform Deployment Notes

### Backend (Azure App Service)

1. Create App Service and configure runtime env vars.
2. Configure SQL firewall + private networking as required.
3. Deploy from GitHub.
4. Run migrations: `npx prisma migrate deploy`.
5. If using queue mode, ensure worker process strategy is defined (separate process/container or dedicated instance).

### Frontend (Azure Static Web Apps / Vercel / Netlify)

1. Configure build command `npm run build`.
2. Configure output directory `dist`.
3. Set `VITE_API_URL` to deployed backend API.
4. Validate auth redirect URIs.

---

## 5) Post-Deployment Verification

### Base Health

```bash
curl https://<backend-host>/api/health
```

### Tenant-Aware Endpoint Smoke Tests

Use an authenticated token and tenant header:

```bash
curl -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: <tenantId>" \
     https://<backend-host>/api/automation/jobs

curl -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: <tenantId>" \
     https://<backend-host>/api/knowledge

curl -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: <tenantId>" \
     https://<backend-host>/api/compliance/reviews
```

### Functional Checks

1. Create an automation job and confirm status transition (`PENDING → RUNNING → COMPLETED|FAILED`).
2. Create a knowledge node linked to a document and verify it appears in `/api/search?type=knowledge`.
3. Run `POST /api/compliance/quality/check` for one document and verify findings are returned.
4. Create and update a review request (`PENDING` → `APPROVED` / `CHANGES_REQUESTED` / `REJECTED`).

---

## 6) Monitoring Signals

- Spike in `generationJob.status=FAILED`
- Jobs stuck in `PENDING`
- Service Bus connection errors (`[AutomationQueue] Service Bus Fehler`)
- High count of unresolved quality findings
- Growing count of review requests in `PENDING` / `CHANGES_REQUESTED`

