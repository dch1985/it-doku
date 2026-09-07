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

### Automation Queue Modes (Backend)

| Use Case | `AUTOMATION_QUEUE_PROVIDER` | `AUTOMATION_QUEUE_AUTORUN` | `AUTOMATION_RUN_IMMEDIATE` |
| --- | --- | --- | --- |
| Lokale Entwicklung / Single-Process | `memory` | `false` | `true` |
| Entkoppelte Verarbeitung mit Queue-Worker | `servicebus` | `true` | `false` |
| Hybrid / Übergang (vorsichtig einsetzen) | `servicebus` | `true` | `true` |

> Bei `servicebus` müssen `AZURE_SERVICE_BUS_CONNECTION_STRING` und `AZURE_SERVICE_BUS_QUEUE_NAME` gesetzt sein.

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
6. (Optional) Automationsjobs testen: `npm run automation:job -- <jobId>` oder Worker starten (`npm run automation:worker`).

### Erweiterte Verifikation: Automate / Comply / Centralize

Nutze für alle Requests einen gültigen Auth-Token und `X-Tenant-ID`.

```bash
API_URL="http://localhost:3002/api"
TENANT_ID="<tenant-id>"

# Health
curl "$API_URL/health"

# Automation API erreichbar?
curl -H "X-Tenant-ID: $TENANT_ID" "$API_URL/automation/jobs"

# Compliance API erreichbar?
curl -H "X-Tenant-ID: $TENANT_ID" "$API_URL/compliance/schemas"

# Knowledge API erreichbar?
curl -H "X-Tenant-ID: $TENANT_ID" "$API_URL/knowledge"

# Search API validiert Query-Parameter (bei fehlendem q: HTTP 400)
curl -i -H "X-Tenant-ID: $TENANT_ID" "$API_URL/search"
```

### Worker Runbook (Queue-Betrieb)

```bash
cd backend

# Einzeln (nützlich für Incident-Handling)
npm run automation:job -- <jobId>

# Dauerhaft als Consumer
npm run automation:worker
```

Weitere Ablauf- und API-Beispiele: `docs/AUTOMATION_COMPLIANCE_RUNBOOK.md`.

