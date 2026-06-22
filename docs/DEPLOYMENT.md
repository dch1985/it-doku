# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Decide automation execution mode (`AUTOMATION_RUN_IMMEDIATE` vs queue-based processing)
- [ ] If queue mode is enabled, verify worker startup and queue connectivity

### Frontend

- [ ] Set all required environment variables
- [ ] Configure Azure AD B2C redirect URIs
- [ ] Build frontend: `npm run build`
- [ ] Test build output

---

## Environment Variables

### Backend Production

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=sqlserver://...
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
FRONTEND_URL=https://your-frontend-domain.com
# Automation behavior
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
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

## Automation Queue Runbook

The automation service supports two execution patterns:

### 1) Immediate execution (simple environments)

Use this mode when you do not run a dedicated worker:

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

Behavior:

- `POST /api/automation/jobs` processes the job inline.
- `POST /api/automation/jobs/:id/retry` also processes inline.

### 2) Queue-based execution (recommended for production)

Use this mode when you want asynchronous processing:

```env
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=<connection-string>
AZURE_SERVICE_BUS_QUEUE_NAME=<queue-name>
```

Start a worker process:

```bash
cd backend
npm run automation:worker
```

Operational checks:

- New jobs move through `PENDING` → `RUNNING` → `COMPLETED` or `FAILED`.
- Queue misconfiguration surfaces as runtime errors in worker/backend logs.

---

## Migration Commands

```bash
# Production migration (no prompts)
cd backend
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## Post-Deployment

1. Test authentication flow
2. Test tenant creation
3. Test document CRUD operations
4. Run automation smoke tests (create connector, create job, verify status updates)
5. Run compliance smoke tests (quality check + review request lifecycle)
6. Validate global search (`/api/search`) and analytics aggregation (`/api/analytics`)
7. Monitor error logs
8. Set up Application Insights (optional)

Example smoke-test commands (replace token/tenant values):

```bash
# health
curl -s http://localhost:8080/api/health

# analytics (tenant-aware)
curl -s http://localhost:8080/api/analytics \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"

# automation jobs list
curl -s http://localhost:8080/api/automation/jobs \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"

# compliance findings for one document
curl -s "http://localhost:8080/api/compliance/quality/findings?documentId=<document-id>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```
