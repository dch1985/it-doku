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

## Automation Worker & Queue Runbook

Die Automations-Pipeline (`/api/automation/*`) unterstützt drei Betriebsarten, gesteuert über Umgebungsvariablen:

| Zielbild | `AUTOMATION_RUN_IMMEDIATE` | `AUTOMATION_QUEUE_AUTORUN` | `AUTOMATION_QUEUE_PROVIDER` | Hinweise |
|---|---:|---:|---|---|
| **Lokale schnelle Tests** | `true` | `false` | `memory` | Jobs werden beim Erstellen direkt im API-Prozess ausgeführt. |
| **Queue-Flow im gleichen Prozess** | `false` | `true` | `memory` | Queue ist pro Prozess; geeignet für Demo/Entwicklung in einem Backend-Prozess. |
| **Entkoppelter Worker-Betrieb** | `false` | `true` | `servicebus` | API publiziert, Worker konsumiert über Azure Service Bus. |

### Wichtige Einschränkung

Der `memory`-Provider ist **prozesslokal**. Wenn API und Worker in getrennten Prozessen laufen, werden Nachrichten nicht geteilt. Für echtes asynchrones Producer/Consumer-Verhalten zwischen Prozessen `servicebus` verwenden.

### Worker-Befehle

```bash
cd backend

# Einzelnen Job manuell ausführen
npm run automation:job -- <jobId>

# Dauerhafter Worker (Queue-Listener)
npm run automation:worker
```

### Minimaler Health-Check nach Deploy (Automate/Centralize/Comply)

```bash
# 1) API erreichbar?
curl https://<backend-host>/api/health

# 2) KPI-API (tenant-aware)
curl -H "X-Tenant-ID: <tenant-id>" https://<backend-host>/api/analytics

# 3) Search-API (validiert q streng)
curl -H "X-Tenant-ID: <tenant-id>" "https://<backend-host>/api/search?q=runbook&type=documents"
```

---

## Post-Deployment

1. Test authentication flow
2. Test tenant creation
3. Test document CRUD operations
4. Monitor error logs
5. Set up Application Insights (optional)
6. Automationsjobs testen: Job via `/api/automation/jobs` anlegen und Status-Übergänge (`PENDING` → `RUNNING` → `COMPLETED|FAILED`) prüfen.
7. Compliance-Check gegen ein Testdokument ausführen: `POST /api/compliance/quality/check`.
8. Global Search validieren: `/api/search?q=<term>` mit und ohne `type=knowledge`.

