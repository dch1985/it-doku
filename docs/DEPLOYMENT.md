# Deployment Guide

This guide reflects the current backend routes and automation worker behavior in `backend/src`.

## 1) Pre-deployment Checklist

### Backend

- [ ] `npx prisma migrate deploy` completed successfully
- [ ] `npx prisma generate` completed successfully
- [ ] `DATABASE_URL` reachable from runtime environment
- [ ] Auth variables configured (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`) unless dev auth mode is intentionally used
- [ ] Tenant-aware calls validated (send `X-Tenant-ID` or `X-Tenant-Slug`)
- [ ] Automation mode selected (see matrix below)

### Frontend

- [ ] `npm run build` succeeds in `frontend/`
- [ ] `VITE_API_URL` points to deployed backend
- [ ] Auth client/tenant IDs configured for target environment
- [ ] Browser-to-backend CORS origin is allowed by `FRONTEND_URL`

## 2) Automation execution mode matrix

Choose one mode explicitly; ambiguous combinations are a common source of stuck jobs.

| Scenario                  | Key env values                                                           | Runtime behavior                                       |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Local quick iteration     | `AUTOMATION_RUN_IMMEDIATE=true`                                          | Job is processed directly after creation               |
| In-process queue consumer | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory`      | Queue publish + in-process subscriber                  |
| External queue worker     | `AUTOMATION_QUEUE_AUTORUN=false`, `AUTOMATION_QUEUE_PROVIDER=servicebus` | API publishes messages, separate worker processes them |

### Constraints

- `AUTOMATION_QUEUE_PROVIDER=servicebus` requires both:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`
- If neither `AUTOMATION_RUN_IMMEDIATE` nor `AUTOMATION_QUEUE_AUTORUN` is `true`, new jobs remain `PENDING` until retried/processed by a worker.

## 3) Environment Variables

### Backend (production baseline)

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=sqlserver://...
FRONTEND_URL=https://your-frontend-domain.com

# Auth
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# Optional AI provider config
AZURE_OPENAI_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

# Automation
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...
AZURE_SERVICE_BUS_QUEUE_NAME=automation-jobs
```

### Frontend (production baseline)

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_DEV_AUTH_ENABLED=false
```

## 4) Release sequence

```bash
# Backend
cd backend
npx prisma migrate deploy
npx prisma generate
npm run build

# Frontend
cd ../frontend
npm run build
```

## 5) Post-deployment verification

Run these checks with a valid bearer token and tenant ID from your environment.

```bash
export API_BASE="https://<backend-host>/api"
export TOKEN="<access_token>"
export TENANT_ID="<tenant_uuid>"

# health + docs
curl -s "$API_BASE/health"
curl -s "$API_BASE/docs"

# analytics contract (Automate/Centralize/Comply KPIs)
curl -s "$API_BASE/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

# automation lifecycle
curl -s "$API_BASE/automation/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

# knowledge + search
curl -s "$API_BASE/knowledge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
curl -s "$API_BASE/search?q=review&type=knowledge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

# compliance findings
curl -s "$API_BASE/compliance/quality/findings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

## 6) Worker runbook

```bash
cd backend

# Run one job synchronously (good for incident handling)
npm run automation:job -- <jobId>

# Run long-lived worker
npm run automation:worker
```

If jobs stay `PENDING` or connectors show `DEGRADED`, check `docs/TROUBLESHOOTING.md` first.
