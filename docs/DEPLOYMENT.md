# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Verify auth config (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`) for protected APIs
- [ ] Decide automation processing mode (see matrix below)
- [ ] If `AUTOMATION_QUEUE_PROVIDER=servicebus`: set both Service Bus variables and ensure queue exists

### Frontend

- [ ] Set all required environment variables
- [ ] Configure Azure AD B2C redirect URIs
- [ ] Build frontend: `npm run build`
- [ ] Test build output
- [ ] Verify `VITE_API_URL` points to backend `/api`

---

## Environment Variables

### Backend Production

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

## Automation Processing Modes

| Mode                         | Required flags                                                                                                                       | Runtime behavior                                                              | Typical usage                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------- |
| Immediate (sync)             | `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_QUEUE_PROVIDER=memory`                                | Job is processed immediately in API process after creation                    | Local dev, small environments    |
| Queue + worker (memory)      | `AUTOMATION_RUN_IMMEDIATE=false`, `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_QUEUE_PROVIDER=memory` + `npm run automation:worker` | Job stays `PENDING` until worker consumes queue message                       | Controlled async processing      |
| Queue + worker (Service Bus) | `AUTOMATION_QUEUE_PROVIDER=servicebus`, valid `AZURE_SERVICE_BUS_*`, usually `AUTOMATION_RUN_IMMEDIATE=false`                        | Jobs are published to Azure Service Bus and consumed by worker/API subscriber | Production-scale async workloads |

> Important: if both `AUTOMATION_RUN_IMMEDIATE=false` and `AUTOMATION_QUEUE_AUTORUN=false`, you must run a worker. Otherwise jobs remain `PENDING`.

---

## Azure Deployment

### Backend (Azure App Service)

1. Create Azure App Service
2. Configure environment variables
3. Set up deployment from GitHub
4. Configure Azure SQL Server firewall
5. Run migrations on deployment
6. Start worker process if queue mode is used (separate process/container recommended)

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

## Worker Commands

```bash
cd backend

# Consume queue continuously (memory or servicebus provider)
npm run automation:worker

# Process one specific job
npm run automation:job -- <jobId>
```

---

## Post-Deployment Smoke Tests

```bash
# 1) Health
curl -s https://<backend-host>/api/health
```

```bash
# 2) Tenant-scoped automation list (auth + tenant required in production)
curl -s https://<backend-host>/api/automation/jobs \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

```bash
# 3) Trigger compliance quality check for one document
curl -s -X POST https://<backend-host>/api/compliance/quality/check \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"<document-id>"}'
```

```bash
# 4) Verify knowledge endpoints respond under tenant context
curl -s https://<backend-host>/api/knowledge \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

---

## Operational Notes

- `PATCH /api/automation/connectors/:id` only works for tenant-owned connectors. Global connectors (`tenantId=null`) are read-only for tenant users.
- `POST /api/compliance/quality/check` is document-scoped; expect meaningful results only when document content contains review/owner/governance context.
- `/api/search?type=knowledge` is optimized for nodes linked to tenant documents. Use `/api/knowledge` for full tenant node inventory (including orphans).
