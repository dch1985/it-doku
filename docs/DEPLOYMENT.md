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

Queue-Hinweise:

- `AUTOMATION_QUEUE_PROVIDER=memory` ist nur für Single-Instance/Dev-ähnliche Setups geeignet.
- Für verteilte Produktion `AUTOMATION_QUEUE_PROVIDER=servicebus` setzen und beide Azure-Service-Bus-Variablen befüllen.
- `AUTOMATION_QUEUE_AUTORUN=true` aktiviert queue-basiertes Abarbeiten beim Job-Publishing.

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

## Automation Queue Betriebsmodi

### Modus A: Immediate Processing (einfacher Einstieg)

```env
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_PROVIDER=memory
```

Eigenschaften:

- Job wird direkt im API-Prozess verarbeitet.
- Kein separater Worker nötig.
- Geeignet für kleine Umgebungen/PoCs.

### Modus B: Queue-basiert (empfohlen für Produktion)

```env
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=automation-jobs
```

Eigenschaften:

- API publiziert Jobs in Azure Service Bus.
- Worker konsumiert asynchron.
- Bessere Entkopplung/Skalierung bei Lastspitzen.

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
2. Test tenant selection and `X-Tenant-ID` propagation
3. Test document CRUD operations
4. Test automation endpoints:
   - `GET /api/automation/connectors`
   - `POST /api/automation/jobs`
   - `GET /api/automation/suggestions`
5. Test compliance endpoints:
   - `POST /api/compliance/quality/check`
   - `GET /api/compliance/reviews`
6. Test centralize endpoints:
   - `GET /api/knowledge`
   - `POST /api/assistant/query`
   - `GET /api/search?q=test`
7. Test KPI endpoint: `GET /api/analytics`
8. Monitor error logs
9. Set up Application Insights (optional)
10. Worker/Queue-Test:
    - Einzeljob: `npm run automation:job -- <jobId>`
    - Listener: `npm run automation:worker`

Siehe auch: [Automation, Knowledge & Compliance Runbook](AUTOMATION_COMPLIANCE_RUNBOOK.md)
