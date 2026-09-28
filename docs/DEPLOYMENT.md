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
# Automation defaults for production queue processing
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=it-doku-automation
```

### Frontend Production

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## Automation Run Modes (Critical)

The backend supports multiple automation execution models. Choose one mode explicitly:

| Mode | Required settings | Behavior | Typical use |
| --- | --- | --- | --- |
| Immediate execution | `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false` | `POST /api/automation/jobs` processes directly in the API process | Local development, fast feedback |
| Queued (in-process consumer) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_RUN_IMMEDIATE=false` | Jobs are published to queue and consumed by backend subscriber | Single-instance deployments |
| Queued (external workers) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_RUN_IMMEDIATE=false`, `AUTOMATION_QUEUE_PROVIDER=servicebus` | Jobs are published to Azure Service Bus; consumers can run in backend instances and/or dedicated workers | Scaled production |
| Manual only | `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_RUN_IMMEDIATE=false` | Jobs stay `PENDING` until manually processed | Controlled backfills / debug |

### Important constraints

- `AUTOMATION_QUEUE_PROVIDER=memory` is **process-local** and cannot be shared across multiple instances.
- For cross-process workers, use `AUTOMATION_QUEUE_PROVIDER=servicebus` and configure both:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`
- If both automation flags are `false`, queued jobs are not processed automatically.

### Worker commands

```bash
cd backend

# Process exactly one known job ID
npm run automation:job -- <jobId>

# Start a long-running worker listener
npm run automation:worker
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
4. Test Automation + Compliance API paths with tenant headers:
   - `GET /api/automation/jobs`
   - `GET /api/compliance/quality/findings`
   - `GET /api/knowledge`
   - `GET /api/assistant/conversations`
5. Monitor error logs (especially queue/auth/tenant warnings)
6. Set up Application Insights (optional)

