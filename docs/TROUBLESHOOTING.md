# Troubleshooting Guide

This guide targets the currently active high-change subsystems:

- **Automate** (`/api/automation`)
- **Centralize** (`/api/knowledge`, `/api/assistant`, `/api/search`)
- **Comply** (`/api/compliance`)

---

## Quick Diagnostic Checklist

1. Backend health: `curl http://localhost:3002/api/health`
2. Frontend API base: verify `VITE_API_URL` in `frontend/.env`
3. Tenant header present: `X-Tenant-ID` or `X-Tenant-Slug`
4. Automation runtime flags set intentionally:
   - `AUTOMATION_QUEUE_AUTORUN`
   - `AUTOMATION_RUN_IMMEDIATE`
   - `AUTOMATION_QUEUE_PROVIDER`

---

## Problem: `Tenant identifier required...`

**Typical response**

```json
{
  "message": "Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header."
}
```

**Cause**

Tenant middleware could not resolve tenant context.

**Fix**

- Add `X-Tenant-ID` or `X-Tenant-Slug` to API requests.
- For local-only development, enable dev auth mode (`DEV_AUTH_ENABLED=true`) and use a tenant-aware flow in the UI.

---

## Problem: Automation jobs stay `PENDING`

**Cause**

No execution mode is active:

- `AUTOMATION_QUEUE_AUTORUN=false`
- `AUTOMATION_RUN_IMMEDIATE=false`

**Fix**

- Local default: set `AUTOMATION_RUN_IMMEDIATE=true`.
- Queue mode: set `AUTOMATION_QUEUE_AUTORUN=true` and choose provider.
- Manual fallback: run `cd backend && npm run automation:job -- <jobId>`.

---

## Problem: Service Bus provider selected but startup fails

**Typical error**

`Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

**Cause**

`AUTOMATION_QUEUE_PROVIDER=servicebus`, but required Service Bus variables are missing.

**Fix**

- Set both:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`
- Or switch provider back to `memory`.

---

## Problem: Connector toggle returns 403

**Typical response**

`Globale Connectoren können nicht angepasst werden`

**Cause**

You are trying to mutate a global connector (`tenantId == null`) from tenant-scoped UI/API.

**Fix**

- Create/manage tenant-scoped connectors for tenant-level toggles.
- Keep global connectors read-only in normal tenant operations.

---

## Problem: Knowledge node exists, but Assistant/Search does not surface it

**Cause**

Assistant and search queries primarily scope knowledge through related documents in the tenant context.

**Fix**

- Link important knowledge nodes to the target document (`documentId`) if they must be surfaced in assistant/search workflows.
- Re-run query/search after updating the node linkage.

---

## Problem: Review request creation fails

**Typical causes**

- Reviewer ID does not exist (`Reviewer wurde nicht gefunden`)
- Document ID is invalid (`Dokument wurde nicht gefunden`)
- Cross-tenant access mismatch (`Zugriff ... nicht erlaubt`)

**Fix**

- Ensure selected reviewer exists (`/api/users` in UI flow).
- Verify document belongs to the same tenant as the requester.
- Retry with a valid `documentId` + `reviewerId`.

---

## Problem: `/api/analytics` fails in production but works locally

**Cause**

Analytics route requires tenant context outside dev mode.

**Fix**

- Send tenant header in API calls.
- Confirm the logged-in user has tenant membership.

---

## Problem: Database connectivity or firewall issues

**Fix steps**

1. Verify `DATABASE_URL` in `backend/.env`
2. Validate DB connectivity from runtime environment
3. Re-run:
   - `cd backend && npx prisma migrate deploy`
   - `cd backend && npx prisma generate`
4. Re-test API health and one tenant-scoped endpoint
