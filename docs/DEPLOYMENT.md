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

#### Automation runtime modes (important)
- `AUTOMATION_RUN_IMMEDIATE=true`: jobs are processed immediately on create/retry in the API process.
- `AUTOMATION_QUEUE_AUTORUN=true`: jobs are published to the configured queue provider.
- `AUTOMATION_QUEUE_PROVIDER=servicebus`: requires both `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME`.
- Prefer enabling **one execution strategy at a time** to avoid ambiguous operations behavior.

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
6. Verify analytics endpoint: `GET /api/analytics` returns `system`, `automation`, `centralize`, `comply`.
7. Verify global search endpoint: `GET /api/search?q=<term>` returns `documents`, `knowledge`, `total`.
8. Automation smoke test (Automate):
   - Create connector
   - Start generation job
   - Validate job transitions (`PENDING -> RUNNING -> COMPLETED|FAILED|CANCELLED`) with immediate mode or active worker
   - Test `retry` and `cancel` constraints
9. Knowledge smoke test (Centralize):
   - Create one node linked to a document and one orphan node
   - Confirm node list and search visibility
10. Compliance smoke test (Comply):
    - Run `POST /api/compliance/quality/check` for one document
    - Resolve/reopen a finding
    - Create review request and update review status
11. (Optional) Worker mode validation: run `npm run automation:worker` and process a queued job.

