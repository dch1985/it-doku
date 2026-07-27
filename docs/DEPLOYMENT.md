# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints

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
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=memory
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

## Automation Queue Runbook

### Choose one execution mode

| Use case | Required env values | Notes |
| --- | --- | --- |
| Local/dev synchronous processing | `AUTOMATION_RUN_IMMEDIATE=true` and `AUTOMATION_QUEUE_AUTORUN=false` | Easiest mode for deterministic local testing. |
| Queue in one process (memory) | `AUTOMATION_QUEUE_PROVIDER=memory`, `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_RUN_IMMEDIATE=false` | API process publishes and consumes messages in-memory. |
| Queue with Azure Service Bus | `AUTOMATION_QUEUE_PROVIDER=servicebus`, `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_RUN_IMMEDIATE=false`, `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE_NAME` | For production-style async processing. |

### Worker commands

```bash
cd backend

# Process one job by ID
npm run automation:job -- <jobId>

# Long-running queue worker
npm run automation:worker
```

### Verification checklist after deploy

1. Create a connector (`POST /api/automation/connectors`) and ensure it appears in `GET /api/automation/connectors`.
2. Create a generation job (`POST /api/automation/jobs`) and validate status progression (`PENDING -> RUNNING -> COMPLETED` or `FAILED`).
3. Check suggestions (`GET /api/automation/suggestions`) and findings (`GET /api/compliance/quality/findings`).
4. Run a manual quality check (`POST /api/compliance/quality/check`) for one document and verify findings are persisted.

### Production call template (authenticated + tenant-aware)

```bash
curl -X POST "https://<backend-host>/api/automation/jobs" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "UPDATE",
    "documentId": "<document-id>",
    "title": "Weekly sync update"
  }'
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
4. Test automation, knowledge and compliance endpoints with tenant headers
5. Monitor error logs
6. Set up Application Insights (optional)

