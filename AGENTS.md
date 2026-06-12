# AGENTS.md

## Cursor Cloud specific instructions

This repo is a monorepo (`npm` workspaces): `backend/` (Express + Prisma API) and
`frontend/` (React 19 + Vite). `frontend-old/` is legacy and not part of the workspace.
Note: the root `README.md`/`CLAUDE.md` are partly stale (they mention a `frontend-new/`
folder, SQLite, and ports 3000/3001). The accurate dev setup is below.

### Services and ports
- Backend API (`backend/`): `http://localhost:3002` (run with `PORT=3002`; the code default is 8080).
- Frontend (`frontend/`): `http://localhost:5173` (Vite).
- Database: Microsoft SQL Server in a Docker container (`itdoku-sqlserver`) on `localhost:1433`.

### Running things
- Both dev servers from the repo root: `npm run dev` (runs `dev:backend` + `dev:frontend` via `concurrently`).
- Individually: `npm run dev --workspace=backend` and `npm run dev --workspace=frontend`.
- Frontend tests: `npm run test:run --workspace=frontend` (Vitest; all pass). Backend has no test script.
- Frontend lint: `npm run lint --workspace=frontend` — NOTE the committed code currently has
  many pre-existing ESLint errors; a non-zero exit here is the repo's normal state, not a setup problem.
- Backend has no `dev`-time DB connection check beyond Prisma; `tsx watch` provides hot reload.

### Database (the most important non-obvious setup)
- Prisma uses `backend/prisma/schema.prisma` with `provider = "sqlserver"` (NOT the root
  `schema.prisma`, which is an unused Postgres copy). There are **no migrations**, so the schema
  is applied with `npx prisma db push` (already done in this environment), not `prisma migrate`.
- Docker is installed in the VM but the daemon and DB container are NOT auto-started. After a fresh
  VM boot, start them before running the backend:
  ```bash
  sudo bash -c 'nohup dockerd > /var/log/dockerd.log 2>&1 &'   # if `docker info` fails
  sleep 8
  sudo docker start itdoku-sqlserver                            # container persists in the snapshot
  ```
  If the `itdoku-sqlserver` container does not exist (e.g. snapshot lost it), recreate it:
  ```bash
  sudo docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" -e "MSSQL_PID=Developer" \
    -p 1433:1433 --name itdoku-sqlserver --restart unless-stopped -d mcr.microsoft.com/mssql/server:2022-latest
  # then create the DB and push the schema:
  sudo docker exec itdoku-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C \
    -Q "IF DB_ID('itdoku') IS NULL CREATE DATABASE itdoku;"
  (cd backend && npx prisma db push)
  ```
- Docker note: this VM needs `fuse-overlayfs` storage driver and the containerd-snapshotter feature
  disabled (Docker 29). That config already lives in `/etc/docker/daemon.json`.

### Environment files (gitignored, already created in this VM)
- `backend/.env`: `PORT=3002`, `NODE_ENV=development`, `DEV_AUTH_ENABLED=true`,
  `FRONTEND_URL=http://localhost:5173`,
  `DATABASE_URL=sqlserver://localhost:1433;database=itdoku;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true`,
  and Azure OpenAI vars. **`AZURE_OPENAI_KEY` must be non-empty** (a dummy value is fine) — the
  OpenAI client in `backend/src/routes/chat.ts` is constructed at import time and the server
  CRASHES on boot if it is empty. With a dummy key the server boots; only `/api/chat` (real AI) fails.
- `frontend/.env`: `VITE_API_URL=http://localhost:3002/api`, `VITE_DEV_AUTH_ENABLED=true`.

### Auth in dev mode
- `DEV_AUTH_ENABLED=true` / `VITE_DEV_AUTH_ENABLED=true` bypass Azure AD B2C. On the landing page,
  click "Start Free Trial" (or "Portal") to log in as a demo admin user (`demo@it-doku.local`).

### Known dev-mode gotchas (pre-existing, not setup issues)
- A single React copy is required. The workspace install otherwise hoists React 18 to the root
  (peer deps of `@azure/msal-react`/`@fluentui`) while `frontend` uses React 19, which causes
  "Invalid hook call" and a blank screen. This is fixed by an `overrides` block in the root
  `package.json` pinning React 19. If that override is ever removed, the app will break — keep it.
- Tenant selection is broken in dev: `/api/tenants` requires Azure auth, so the sidebar
  TenantSelector cannot load tenants. Tenant-scoped pages (e.g. Documentation list, document
  edit/save) therefore need a tenant injected into the frontend store. In the browser console:
  ```js
  localStorage.setItem('tenant-storage', JSON.stringify({state:{currentTenant:{id:'<TENANT_ID>',name:'Demo Tenant',slug:'demo',role:'OWNER',subscriptionStatus:'ACTIVE',isActive:true},tenants:[]},version:0}); location.reload()
  ```
  Get a tenant id from SQL Server (`SELECT id FROM tenants`); seed one with
  `INSERT INTO tenants (id,name,slug,subscriptionStatus,isActive,createdAt,updatedAt) VALUES (NEWID(),'Demo Tenant','demo','ACTIVE',1,SYSUTCDATETIME(),SYSUTCDATETIME())`.
- Not every route in `backend/src/routes/` is mounted in `backend/src/index.ts` (e.g. assets,
  passwords, contracts, network-devices are NOT mounted → 404), and some pages are orphaned from
  the frontend router (e.g. `Centralize`/`Comply`/`Automate`). Features that work end-to-end in dev:
  documents (list/get/update/delete need a selected tenant; **create is broken** because the
  `/api/documents` route never sets `req.user`), global search (`/api/search`), the knowledge API
  (`/api/knowledge`), and analytics (read). Automation/compliance use Prisma models absent from the
  SQL Server schema and will error.
- The API is rate-limited (`express-rate-limit`); rapid repeated requests can return HTTP 429
  ("Too many requests") — just retry after a moment.
