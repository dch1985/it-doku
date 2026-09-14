# Deployment & Operations Guide

This guide focuses on the currently active backend/frontend plus the high-change subsystems:

- **Automate** (`/api/automation`)
- **Centralize** (`/api/knowledge`, `/api/assistant`, `/api/search`)
- **Comply** (`/api/compliance`)

---

## 1) Pre-Deployment Checklist

### Backend

- [ ] `cd backend && npm run build`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Validate `DATABASE_URL`
- [ ] Validate tenant-aware auth flow (`X-Tenant-ID`/`X-Tenant-Slug`)
- [ ] Confirm automation runtime flags (see section 3)

### Frontend

- [ ] `cd frontend && npm run build`
- [ ] Verify `VITE_API_URL` points to backend `/api`
- [ ] Validate tenant selection + API calls in browser

---

## 2) Environment Variables

### Backend (core runtime variables)

```env
NODE_ENV=production
PORT=3002
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=sqlserver://...

# Optional Azure OpenAI features
AZURE_OPENAI_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

# Tenant/dev auth behavior
DEV_AUTH_ENABLED=false

# Automation runtime
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_PROVIDER=memory # memory | servicebus
AZURE_SERVICE_BUS_CONNECTION_STRING=
AZURE_SERVICE_BUS_QUEUE_NAME=
```

### Frontend

```env
VITE_API_URL=https://your-backend-domain/api
VITE_DEV_AUTH_ENABLED=false
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=
```

---

## 3) Automation Execution Modes

Choose one mode explicitly to avoid stuck jobs.

| Mode                             | Required flags                                                                             | Behavior                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Immediate (simple local/default) | `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false`                          | Job is processed directly after creation.                          |
| Queue, same process              | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory`                        | API process subscribes and processes queue messages in-process.    |
| Queue, distributed worker        | `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=servicebus` + Service Bus vars | Jobs are published to Azure Service Bus and consumed by worker(s). |

> If both `AUTOMATION_QUEUE_AUTORUN` and `AUTOMATION_RUN_IMMEDIATE` are `false`, jobs stay `PENDING` until manually processed.

---

## 4) Worker Operations

```bash
cd backend

# Process one job once
npm run automation:job -- <jobId>

# Run long-lived queue subscriber
npm run automation:worker
```

Use long-lived workers mainly for `servicebus` mode.

---

## 5) Post-Deployment Verification

Use real tenant IDs/slugs in production tests.

```bash
# Health
curl -sS https://<backend>/api/health

# Automation jobs list
curl -sS https://<backend>/api/automation/jobs \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>"

# Knowledge nodes list
curl -sS "https://<backend>/api/knowledge?documentId=<doc-id>" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>"

# Compliance reviews
curl -sS https://<backend>/api/compliance/reviews \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Authorization: Bearer <token>"
```

Validate at minimum:

1. Jobs transition through expected statuses.
2. Knowledge nodes can be created and linked to documents.
3. Quality checks and review requests are persisted.
4. Analytics endpoint responds: `GET /api/analytics`.
