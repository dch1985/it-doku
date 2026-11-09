# Deployment Guide

This guide focuses on production deployment and runtime operations for the
Automate, Centralize, and Comply workflows.

## 1) Pre-Deployment Checklist

### Backend

- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Set required backend env vars (see section 2)
- [ ] Confirm DB reachability (SQL firewall, network rules, credentials)
- [ ] Verify auth setup (`/api/auth/me`) and tenant resolution
- [ ] Decide automation execution mode (sync vs queue; see section 3)

### Frontend

- [ ] Set required frontend env vars
- [ ] Build frontend: `npm run build`
- [ ] Verify `VITE_API_URL` points to backend `/api`
- [ ] Validate tenant-aware pages (`/automate`, `/centralize`, `/comply`, `/analytics`)

---

## 2) Environment Variables

### Backend (production baseline)

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=sqlserver://...
FRONTEND_URL=https://your-frontend-domain.com

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

# Automation execution controls
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_AUTORUN=true
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=automation-jobs
```

### Frontend

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## 3) Automation Execution Modes (Important)

| Mode                       | Required flags                  | When to use                           |
| -------------------------- | ------------------------------- | ------------------------------------- |
| Synchronous in API process | `AUTOMATION_RUN_IMMEDIATE=true` | Local/dev or very low job volume.     |
| Queue autorun              | `AUTOMATION_QUEUE_AUTORUN=true` | Production queue-based execution.     |
| Manual/worker only         | both flags `false`              | Controlled/manual processing windows. |

Additional constraints:

- `AUTOMATION_QUEUE_PROVIDER=memory` is process-local and not durable.
- For cross-process or multi-instance deployments, use `servicebus`.
- If both flags are `false`, jobs stay `PENDING` until manually processed.

---

## 4) Azure Deployment Sequence

### Backend (Azure App Service)

1. Create App Service and configure runtime.
2. Add backend environment variables.
3. Configure SQL firewall/network access.
4. Deploy backend.
5. Run `npx prisma migrate deploy` and `npx prisma generate`.
6. Validate `GET /api/health`.

### Frontend (Azure Static Web Apps or equivalent)

1. Configure `VITE_API_URL` to backend `/api`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Validate tenant login + tenant selection in deployed UI.

---

## 5) Post-Deployment Smoke Tests

Run these checks with a valid bearer token and `X-Tenant-ID`.

```bash
# Health and docs
curl -s https://<backend>/api/health
curl -s https://<backend>/api/docs

# Automate / queue-facing endpoints
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  https://<backend>/api/automation/jobs

# Centralize endpoints
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  "https://<backend>/api/knowledge?documentId=<docId>"

# Comply endpoints
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  "https://<backend>/api/compliance/reviews?documentId=<docId>"

# Search + analytics
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  "https://<backend>/api/search?q=backup&type=documents&limit=5"
curl -s -H "Authorization: Bearer <token>" -H "X-Tenant-ID: <tenantId>" \
  https://<backend>/api/analytics
```

---

## 6) Worker Operations

```bash
cd backend

# Process one job by ID
npm run automation:job -- <jobId>

# Run worker listener
npm run automation:worker
```

If jobs remain in `PENDING`, check queue mode/flags and provider configuration
first (see `docs/TROUBLESHOOTING.md`).
