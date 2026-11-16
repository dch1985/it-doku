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

## Automation Processing Modes

Automation behavior is controlled by these backend variables:

- `AUTOMATION_RUN_IMMEDIATE`
- `AUTOMATION_QUEUE_AUTORUN`
- `AUTOMATION_QUEUE_PROVIDER`

### Mode A: Immediate (synchronous)

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

- Jobs are processed directly during API calls (`POST /api/automation/jobs`, retry).
- No dedicated worker required.

### Mode B: In-process queue consumer

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_QUEUE_PROVIDER=memory
```

- API publishes queue messages.
- Backend process consumes queue messages internally.

### Mode C: External queue + worker

```env
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=<connection-string>
AZURE_SERVICE_BUS_QUEUE_NAME=<queue-name>
```

Use dedicated worker runtime:

```bash
cd backend
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
4. Monitor error logs
5. Set up Application Insights (optional)
6. (Optional) Automationsjobs testen: `npm run automation:job -- <jobId>` oder Worker starten (`npm run automation:worker`).
7. Verify tenant-scoped endpoints with headers (`X-Tenant-ID` or `X-Tenant-Slug`) for:
   - `/api/automation/*`
   - `/api/compliance/*`
   - `/api/knowledge/*`
   - `/api/assistant/*`

