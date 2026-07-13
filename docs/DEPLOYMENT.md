# Deployment Guide

## Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set all required environment variables
- [ ] Configure Azure SQL Server firewall rules
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Decide automation mode (`AUTOMATION_RUN_IMMEDIATE` vs queue-based autorun)
- [ ] If queue-based: configure Service Bus credentials and queue name
- [ ] Validate tenant context forwarding (`X-Tenant-ID`/`X-Tenant-Slug`) from frontend or API gateway

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
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=automation-jobs
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

## Automation Queue Operating Modes

Use one mode per environment:

| Mode | Core variables | Recommended use |
|------|----------------|-----------------|
| Immediate execution | `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false` | Local development and quick smoke checks |
| Queue autorun (memory) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory` | Single-instance test environments |
| Queue autorun (Service Bus) | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=servicebus` + Service Bus env vars | Production / multi-instance |

If `AUTOMATION_QUEUE_PROVIDER=servicebus`, both `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME` are required.

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
4. Smoke test Automate/Centralize/Comply endpoints with tenant header
5. Monitor error logs
6. Set up Application Insights (optional)
7. (Optional) Automationsjob testen: `npm run automation:job -- <jobId>`
8. (Optional) Worker starten: `npm run automation:worker`

### Smoke Test Commands

> Replace placeholders with real IDs.

```bash
BASE_URL=https://your-backend-api.com

# Health
curl "$BASE_URL/api/health"

# Automation connectors
curl -H "X-Tenant-ID: <tenantId>" "$BASE_URL/api/automation/connectors"

# Knowledge nodes for one document
curl -H "X-Tenant-ID: <tenantId>" "$BASE_URL/api/knowledge?documentId=<documentId>"

# Run compliance quality check
curl -X POST "$BASE_URL/api/compliance/quality/check" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenantId>" \
  -d '{"documentId":"<documentId>"}'

# Create review request
curl -X POST "$BASE_URL/api/compliance/reviews" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenantId>" \
  -d '{"documentId":"<documentId>","reviewerId":"<reviewerId>","comments":"Release readiness review"}'
```

