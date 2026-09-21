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

## Automation Runtime Modes (Production)

| Mode                      | Relevant Flags                                                      | Typical Use                                    |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| API-sync processing       | `AUTOMATION_RUN_IMMEDIATE=true`                                     | Small environments, predictable low throughput |
| In-memory queue auto-run  | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory` | Single-node setups without external queue      |
| External queue processing | `AUTOMATION_QUEUE_PROVIDER=servicebus` + Service Bus credentials    | Multi-instance / resilient async processing    |

> If both `AUTOMATION_RUN_IMMEDIATE` and `AUTOMATION_QUEUE_AUTORUN` are `false`, jobs remain pending until manually processed or consumed by worker/queue infrastructure.

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
6. Validate Automate/Centralize/Comply APIs with tenant context

### Smoke checks for Automate / Centralize / Comply

Use a valid bearer token and tenant id from your environment:

```bash
TOKEN="<jwt>"
TENANT="<tenant-id>"
BASE_URL="https://your-backend-api.com/api"

# Automation
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT" "$BASE_URL/automation/jobs"

# Knowledge Nodes
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT" "$BASE_URL/knowledge"

# Compliance review requests
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT" "$BASE_URL/compliance/reviews"

# Analytics
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT" "$BASE_URL/analytics"

# Search (documents + knowledge)
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-ID: $TENANT" "$BASE_URL/search?q=runbook&type=knowledge&limit=10"
```

### Optional queue worker checks

```bash
cd backend
npm run automation:job -- <jobId>
npm run automation:worker
```
