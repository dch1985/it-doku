# Deployment Guide

This guide covers deployment requirements for the current backend/frontend stack and the newer Automate/Centralize/Comply subsystems.

For day-2 operations (job handling, findings, reviews, assistant flows), also see:

- `docs/AUTOMATION_COMPLIANCE_RUNBOOK.md`

## Pre-deployment checklist

### Backend

- [ ] Install dependencies: `npm install --workspace=backend`
- [ ] Build backend: `npm run build --workspace=backend`
- [ ] Run migrations: `cd backend && npx prisma migrate deploy`
- [ ] Generate Prisma client: `cd backend && npx prisma generate`
- [ ] Set all required environment variables
- [ ] Validate database connectivity from runtime environment
- [ ] Validate auth setup (Azure tenant/client values in production)

### Frontend

- [ ] Install dependencies: `npm install --workspace=frontend`
- [ ] Build frontend: `npm run build --workspace=frontend`
- [ ] Set all required frontend environment variables
- [ ] Verify API base URL points to backend `/api`
- [ ] Verify login redirect URIs and tenant settings

## Environment variables

### Backend production baseline

```env
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-frontend-domain.com

DATABASE_URL=sqlserver://...

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=false
AUTOMATION_QUEUE_PROVIDER=memory

# Required only when AUTOMATION_QUEUE_PROVIDER=servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_SERVICE_BUS_QUEUE_NAME=

# Must be false in production
DEV_AUTH_ENABLED=false
```

### Frontend production baseline

```env
VITE_API_URL=https://your-backend-domain/api
VITE_DEV_AUTH_ENABLED=false
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

## Queue mode decisions (automation jobs)

The backend supports two processing models:

1. **Immediate execution**
   - `AUTOMATION_RUN_IMMEDIATE=true`
   - Jobs are processed directly after creation/retry.
   - Simplest setup for low volume.

2. **Queue-based execution**
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - Jobs are published via `AUTOMATION_QUEUE_PROVIDER`.
   - For `servicebus`, both Azure Service Bus env vars are mandatory.
   - Run a worker process:
     - `npm run automation:worker --workspace=backend`

## Deployment flow (Azure or equivalent)

1. Provision database and network access.
2. Deploy backend service with env vars above.
3. Run migrations in deployed environment.
4. Deploy frontend with `VITE_API_URL` pointing to backend `/api`.
5. Validate auth redirect URLs and tenant access.
6. If using queue mode, deploy/start a worker process.

## Post-deployment smoke tests

Set helper variables:

```bash
export API_BASE="https://your-backend-domain"
export TOKEN="<bearer-token>"
export TENANT_ID="<tenant-id>"
```

### Core health

```bash
curl "$API_BASE/api/health"
```

### Tenant-scoped feature checks

```bash
curl "$API_BASE/api/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

curl "$API_BASE/api/automation/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

curl "$API_BASE/api/compliance/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"

curl "$API_BASE/api/knowledge" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

### Search check

```bash
curl "$API_BASE/api/search?q=network&type=documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

## Operational commands

```bash
# Start one-off processing for a known job ID
cd backend
npm run automation:job -- <jobId>

# Start queue listener worker
npm run automation:worker
```

