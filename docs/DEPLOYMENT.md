# Deployment Guide

## Pre-Deployment Checklist

### Backend
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Validate auth + tenant flow with a real token
- [ ] Decide automation runtime mode (immediate vs queue)

### Frontend
- [ ] Set all required environment variables
- [ ] Configure Azure AD B2C redirect URIs
- [ ] Build frontend: `npm run build`
- [ ] Confirm API URL points to backend `/api` base

---

## Environment Variables

### Backend Production

```env
NODE_ENV=production
PORT=3002
DATABASE_URL=sqlserver://...

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

FRONTEND_URL=https://your-frontend-domain.com

# Automation / Queue
AUTOMATION_QUEUE_PROVIDER=memory        # memory | servicebus
AUTOMATION_QUEUE_AUTORUN=false          # publish + queue subscribe in API process
AUTOMATION_RUN_IMMEDIATE=true           # sync processing during job creation (only if AUTORUN=false)
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

## Automation Runtime Modes (Operational)

| Mode | Env setup | Behavior |
|---|---|---|
| Immediate processing | `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_RUN_IMMEDIATE=true` | `POST /api/automation/jobs` processes jobs synchronously via `automationService.processJob`. |
| Queue auto-run | `AUTOMATION_QUEUE_AUTORUN=true` | Jobs are published to queue provider and consumed by a queue subscriber in the API process. |
| Manual execution | `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_RUN_IMMEDIATE=false` | Jobs stay `PENDING` until processed manually (`npm run automation:job -- <jobId>`). |

> Important: If `AUTOMATION_QUEUE_PROVIDER=servicebus`, both `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME` must be set.

---

## Azure Deployment

### Backend (Azure App Service)
1. Create Azure App Service
2. Configure environment variables
3. Set up deployment from GitHub
4. Configure Azure SQL Server firewall
5. Run migrations on deployment

### Frontend (Azure Static Web Apps)
1. Create Azure Static Web App
2. Configure environment variables
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Configure Azure AD B2C redirect URIs

---

## Migration Commands

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## Post-Deployment Operational Runbook

### 1) Health + baseline checks
```bash
curl https://<backend-domain>/api/health
curl https://<backend-domain>/api/docs
```

### 2) Tenant-scoped interface checks
Use a valid bearer token and tenant header:

```bash
curl https://<backend-domain>/api/analytics \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"

curl https://<backend-domain>/api/automation/jobs \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"

curl https://<backend-domain>/api/knowledge \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

### 3) Automation smoke test
1. Create a job with `POST /api/automation/jobs`.
2. Verify status transition:
   - immediate mode: `PENDING -> RUNNING -> COMPLETED|FAILED` quickly.
   - manual mode: remains `PENDING` until processed manually.
3. If needed, process manually:

```bash
cd backend
npm run automation:job -- <jobId>
```

### 4) Compliance cycle smoke test
1. Trigger checks: `POST /api/compliance/quality/check`.
2. Resolve or reopen finding: `PATCH /api/compliance/quality/findings/:id`.
3. Create review request: `POST /api/compliance/reviews`.
4. Update review state: `PATCH /api/compliance/reviews/:id`.

### 5) Logs to watch
- `[AutomationQueue]` provider/subscription errors
- `[AutomationService] Failed to process queued job`
- `[Compliance]` errors around quality checks and review updates

For issue-specific fixes, see [`docs/TROUBLESHOOTING.md`](./TROUBLESHOOTING.md).

