# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Verify automation mode (`AUTOMATION_QUEUE_AUTORUN` vs `AUTOMATION_RUN_IMMEDIATE`)
- [ ] If `AUTOMATION_QUEUE_PROVIDER=servicebus`: validate queue access and worker rollout

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

### Automation Queue Mode Matrix

Choose exactly one processing strategy and validate it before go-live:

| Mode                  | Env setup                                                            | Runtime behavior                                             | Operational note                                                  |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Immediate processing  | `AUTOMATION_RUN_IMMEDIATE=true` and `AUTOMATION_QUEUE_AUTORUN=false` | Jobs are processed inline during `POST /api/automation/jobs` | Easiest setup, but API request may run longer                     |
| In-process queue      | `AUTOMATION_QUEUE_AUTORUN=true`                                      | API publishes and consumes queue events itself               | Works with `memory` provider only inside the same backend process |
| External queue worker | `AUTOMATION_QUEUE_PROVIDER=servicebus` (+ Azure Service Bus vars)    | API publishes to Service Bus, worker consumes messages       | Use `npm run automation:worker` in a dedicated worker process     |

> Important: `memory` queue is process-local. A separate worker process cannot consume jobs created by the API process when `memory` is used.

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
4. Monitor error logs
5. Set up Application Insights (optional)
6. (Optional) Automationsjobs testen: `npm run automation:job -- <jobId>` oder Worker starten (`npm run automation:worker`).

### Recommended smoke test for Automate / Centralize / Comply

1. Create a job: `POST /api/automation/jobs`
2. Verify status transition in `GET /api/automation/jobs` (`PENDING` -> `RUNNING` -> `COMPLETED` or `FAILED`)
3. Run compliance check once: `POST /api/compliance/quality/check` with a real `documentId`
4. Verify KPIs load: `GET /api/analytics` with tenant header
5. Test one global search query: `GET /api/search?q=<term>`
