# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set required environment variables
- [ ] Confirm database connectivity and firewall rules
- [ ] Validate auth + tenant flow (`/api/auth/*`, tenant headers)
- [ ] Choose automation execution mode (immediate, queue, or manual)
- [ ] If `AUTOMATION_QUEUE_PROVIDER=servicebus`, validate queue name + connection string

### Frontend

- [ ] Set required environment variables
- [ ] Configure Azure AD B2C redirect URIs
- [ ] Build frontend: `npm run build`
- [ ] Verify API target (`VITE_API_URL`) and tenant header handling in UI flows

---

## Environment Variables

### Backend (production baseline)

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

AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=it-doku-generation-jobs
```

### Frontend (production baseline)

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

### Automation Mode Matrix

| Use case                     | `AUTOMATION_RUN_IMMEDIATE` | `AUTOMATION_QUEUE_AUTORUN` | `AUTOMATION_QUEUE_PROVIDER` | Result                                               |
| ---------------------------- | -------------------------- | -------------------------- | --------------------------- | ---------------------------------------------------- |
| Local synchronous processing | `true`                     | `false`                    | `memory`                    | Job is processed in request cycle.                   |
| Queue-triggered processing   | `false`                    | `true`                     | `servicebus` (or `memory`)  | Job is published and processed by queue subscribers. |
| Manual processing only       | `false`                    | `false`                    | any                         | Job remains pending until manual processing command. |

> Note: `memory` provider is process-local and not suitable for multi-instance production deployments.

---

## Azure Deployment

### Backend (Azure App Service)

1. Create Azure App Service.
2. Configure all backend env vars.
3. Set deployment from GitHub.
4. Configure Azure SQL firewall/network access.
5. Run `npx prisma migrate deploy` during release.

### Frontend (Azure Static Web Apps)

1. Create Azure Static Web App.
2. Configure frontend env vars.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Configure Azure AD B2C redirect URIs.

---

## Migration Commands

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## Post-Deployment Verification

Run representative checks against mounted production APIs:

```bash
# Health
curl https://<backend-host>/api/health

# Automate (tenant header required in non-dev mode)
curl https://<backend-host>/api/automation/jobs \
  -H "X-Tenant-ID: <tenant-id>"

# Centralize search + knowledge
curl "https://<backend-host>/api/search?q=backup&type=knowledge" \
  -H "X-Tenant-ID: <tenant-id>"

# Comply quality findings
curl "https://<backend-host>/api/compliance/quality/findings" \
  -H "X-Tenant-ID: <tenant-id>"
```

Expected result: no auth/tenant errors for correctly scoped requests, and valid JSON response payloads.

---

## Automation Operations Runbook

```bash
# Process a single job by ID
cd backend
npm run automation:job -- <jobId>

# Start worker listener process
npm run automation:worker
```

Operational notes:

- With `AUTOMATION_QUEUE_AUTORUN=true`, jobs are published to queue automatically on create/retry.
- With both autorun and immediate disabled, manual processing is required.
- For distributed deployments, use `AUTOMATION_QUEUE_PROVIDER=servicebus` and monitor queue depth + failed jobs.
