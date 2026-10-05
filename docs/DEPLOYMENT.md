# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Decide automation execution mode (inline vs queue) and set flags accordingly
- [ ] If using Service Bus: verify queue name + connection string are present
- [ ] Verify tenant routing headers in API clients (`X-Tenant-ID` or `X-Tenant-Slug`)

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
# Automation mode flags (see matrix below)
AUTOMATION_QUEUE_AUTORUN=true
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

## Automation Execution Modes (Production Runbook)

The backend job flow in `automation.service.ts` follows this precedence:

1. If `AUTOMATION_QUEUE_AUTORUN=true` -> publish to queue provider
2. Else if `AUTOMATION_RUN_IMMEDIATE=true` -> process inline in API process
3. Else -> job stays pending until manual processing

Choose one mode intentionally:

| Mode                | Required Flags                                                                                | Notes                                      |
| ------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Inline (simple)     | `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_RUN_IMMEDIATE=true`                             | Easiest setup; work happens in API process |
| Queue (memory)      | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory`                           | In-process queue subscriber                |
| Queue (Service Bus) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=servicebus`, Service Bus vars set | Decoupled queue transport                  |
| Manual only         | both flags `false`                                                                            | Use CLI to process jobs manually           |

### Worker commands

```bash
cd backend

# Process one specific job
npm run automation:job -- <jobId>

# Keep worker running for queue consumption
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
4. Validate automation endpoints (`/api/automation/connectors`, `/api/automation/jobs`)
5. Validate analytics + search endpoints (`/api/analytics`, `/api/search`)
6. Monitor error logs
7. Set up Application Insights (optional)

### Recommended smoke tests

```bash
# Basic health
curl -s http://localhost:3002/api/health
curl -s http://localhost:3002/api/docs

# Tenant-scoped checks (replace with a real tenant ID)
curl -s -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/automation/jobs
curl -s -H "X-Tenant-ID: <tenant-id>" "http://localhost:3002/api/search?q=backup&type=documents"
curl -s -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/analytics
```

### Common pitfalls

- **Jobs stay in `PENDING`:** both automation flags are disabled.
- **Service Bus errors on startup:** `AUTOMATION_QUEUE_PROVIDER=servicebus` without required Azure Service Bus vars.
- **400 tenant errors:** tenant header missing on tenant-scoped endpoints.
