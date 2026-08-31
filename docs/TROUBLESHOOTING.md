# Troubleshooting Guide

This guide focuses on current issues around Automate/Centralize/Comply and their supporting APIs.

For workflow-level operations, see:

- `docs/AUTOMATION_COMPLIANCE_RUNBOOK.md`

## Quick diagnostics first

```bash
# Backend health
curl http://localhost:3002/api/health

# Check local env values quickly
rg "^(PORT|DEV_AUTH_ENABLED|AUTOMATION_QUEUE_|AZURE_SERVICE_BUS_)" backend/.env
rg "^VITE_API_URL" frontend/.env
```

If backend health fails, solve that first before debugging feature endpoints.

## Problem: Backend does not start

### Symptoms

- `EADDRINUSE` in backend logs
- Frontend cannot connect to `/api/*`

### Checks

1. Verify configured backend port in `backend/.env` (`PORT=3002` by default).
2. Confirm frontend uses matching API URL (`VITE_API_URL=http://localhost:3002/api`).
3. Restart backend after env changes.

## Problem: 401 / 403 / "Tenant identifier required"

### Why it happens

Most feature routes (`/api/automation`, `/api/compliance`, `/api/knowledge`, `/api/assistant`, `/api/search`, `/api/analytics`) use auth + tenant middleware.

### Fix

- Include both headers in requests:
  - `Authorization: Bearer <token>`
  - `X-Tenant-ID: <tenant-id>` (or `X-Tenant-Slug`)
- In local dev, enable:
  - `DEV_AUTH_ENABLED=true`
  - `VITE_DEV_AUTH_ENABLED=true`

## Problem: Automation jobs never run (stuck in PENDING)

### Why it happens

Execution mode is env-driven:

- `AUTOMATION_RUN_IMMEDIATE=true` -> process immediately in API request.
- `AUTOMATION_QUEUE_AUTORUN=true` -> publish to queue; a worker/consumer must process messages.

### Fix checklist

1. Inspect env flags in `backend/.env`.
2. If queue mode is enabled, start worker:
   - `cd backend && npm run automation:worker`
3. If using `servicebus`, also configure both:
   - `AZURE_SERVICE_BUS_CONNECTION_STRING`
   - `AZURE_SERVICE_BUS_QUEUE_NAME`

## Problem: Service Bus queue errors

### Typical error

- Provider set to `servicebus`, but connection string or queue name missing.

### Fix

- Either provide both Service Bus env vars, or switch to:
  - `AUTOMATION_QUEUE_PROVIDER=memory`

## Problem: Connector toggle/update fails

### Why it happens

`PATCH /api/automation/connectors/:id` only accepts:

```json
{ "isActive": true }
```

Also, global connectors (`tenantId == null`) are intentionally immutable for tenant users.

### Fix

- Send `isActive` as boolean, not string.
- Only toggle tenant-owned connectors.

## Problem: Retry/cancel endpoints reject job action

### Why it happens

From service rules:

- Retry is blocked while job is `RUNNING`.
- Cancel is only valid for `PENDING` or `RUNNING`.

### Fix

- Query current state first:
  - `GET /api/automation/jobs/:id`
- Trigger action based on current status.

## Problem: Compliance quality findings look unexpected

### Why it happens

`POST /api/compliance/quality/check` currently detects:

- Placeholder text (`lorem ipsum`, `dummy text`)
- Password-like plain text (`password: ...`)
- Missing review wording
- Missing owner/verantwortlich wording

### Fix

- Treat findings as deterministic rule output.
- Resolve via:
  - `PATCH /api/compliance/quality/findings/:id` with `action: "RESOLVE"` or `action: "REOPEN"`.

## Problem: Search returns empty results

### Checks

1. Confirm `q` query parameter is present and non-empty.
2. Confirm tenant header/auth token are valid.
3. Try without `type` filter to search both documents and knowledge.
4. Verify tenant actually has documents/knowledge nodes.

Example:

```bash
curl "http://localhost:3002/api/search?q=backup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID"
```

## Problem: Database connection failures

### Common causes

- Firewall/network rules block SQL access
- Invalid `DATABASE_URL`
- Missing migrations

### Fix checklist

1. Verify DB network/firewall allows backend runtime IP.
2. Re-check `DATABASE_URL`.
3. Run:
   - `cd backend && npx prisma migrate deploy`
   - `cd backend && npx prisma generate`
4. Re-test with:
   - `curl http://localhost:3002/api/health`

