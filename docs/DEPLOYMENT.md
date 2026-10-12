# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Verify tenant headers are forwarded (`X-Tenant-ID` or `X-Tenant-Slug`)
- [ ] Validate automation mode flags (`AUTOMATION_QUEUE_AUTORUN`, `AUTOMATION_RUN_IMMEDIATE`, `AUTOMATION_QUEUE_PROVIDER`)

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
AUTOMATION_QUEUE_PROVIDER=memory # set to servicebus for cross-process workers
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

## Automate/Centralize/Comply Runbook

### 1) Choose automation execution mode

| `AUTOMATION_QUEUE_AUTORUN` | `AUTOMATION_RUN_IMMEDIATE` | Expected behavior |
| --- | --- | --- |
| `false` | `true` | Jobs are processed inline in the API process right after `POST /api/automation/jobs` |
| `true` | `true` or `false` | Jobs are published to the configured queue provider and consumed by subscribers/workers |
| `false` | `false` | Jobs remain `PENDING` until manual processing (`automation:job`) |

> `memory` provider is process-local. For distributed workers use `servicebus` with `AZURE_SERVICE_BUS_*` variables.

### 2) Start worker only when required

```bash
cd backend
npm run automation:worker      # queue listener mode
npm run automation:job -- <id> # single-job execution
```

### 3) Smoke-test public interfaces after deploy

```bash
# Tenant-aware automation list
curl -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  https://<api-host>/api/automation/jobs

# Knowledge nodes
curl -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  https://<api-host>/api/knowledge

# Compliance quality checks
curl -X POST -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"<doc-id>"}' \
  https://<api-host>/api/compliance/quality/check
```

### 4) Known production constraints

- Search (`/api/search`) and assistant retrieval currently favor knowledge nodes linked to a document in the same tenant.
- Global connectors (`tenantId = null`) are readable by tenants but not toggleable via tenant-level `PATCH /api/automation/connectors/:id`.

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
4. Monitor error logs
5. Set up Application Insights (optional)
6. (Optional) Automationsjobs testen: `npm run automation:job -- <jobId>` oder Worker starten (`npm run automation:worker`).

