# CLAUDE.md

This file provides guidance to AI coding agents working with code in this repository.

## Project Overview

**TrustDoc** is a focused IT documentation workspace for MSPs and IT teams. It combines NIST-grade templates with an **agentic documentation expert** — a deterministic, rule-based agent (no chatbot, no generative AI) that audits documentation against server/network/backup/security best practice and applies fixes only after user approval.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend:** Node.js + Express, TypeScript, Prisma ORM
- **Database:** SQL Server (Azure SQL in production, Docker container in development)
- **Auth:** Azure AD via MSAL in production; dev-login when `DEV_AUTH_ENABLED=true`

## Repository Structure

- `frontend/` – the active React app (`@trustdoc/frontend`)
- `backend/` – the Express API (`@trustdoc/backend`)
- `frontend-old/`, `legacy/`, `files/` – historical code, do not extend

### Frontend (`frontend/`)

- Hash-based routing in `src/PortalApp.tsx` (no react-router). Routes: `#` dashboard, `#docs`, `#document/:id`, `#infrastructure`, `#agent`, `#settings`.
- Pages live in `src/pages/` (Dashboard, Documents, DocumentDetail, Assets, Agent, Settings, LandingPage).
- Layout & grouped sidebar: `src/layouts/MainLayout.tsx`.
- Data fetching via hooks in `src/hooks/` (`useDocuments`, `useTemplates`, `useAssets`, `useAgent`, `useAnalytics`, …); tenant header `X-Tenant-ID` added when a tenant is selected.
- State: Zustand stores in `src/stores/` (theme, sidebar, tenant, app).
- UI: shadcn/ui components in `src/components/ui/`, Lucide icons, Tailwind with HSL CSS variables in `src/index.css` (light + dark).

### Backend (`backend/`)

- Entry: `src/index.ts` (port 3001 by default). In dev mode, `devAuthenticate` resolves a demo user for every `/api` request.
- Routes (`src/routes/`): `documents`, `templates`, `assets`, `agent`, `analytics`, `search`, `comments`, `audit`, `notifications`, `auth`, `tenants`, `upload`.
- The agent lives in `src/services/agent.service.ts` + `src/routes/agent.ts`. Skills: `DOC_HEALTH`, `TEMPLATE_COMPLIANCE`, `COVERAGE_GAP`, `REVIEW_CYCLE`. Findings persist to `agent_runs` / `agent_findings`; `apply` executes the proposed action (SET_STATUS, ADD_TAGS, APPEND_SECTIONS, CREATE_DOCUMENT) and audit-logs it.
- Templates: `src/templates/templateDefinitions.ts` (11 seedable NIST/ISO templates) and `src/templates/categoryTemplates.ts` (category skeletons).
- Schema: `backend/prisma/schema.prisma` (SQL Server provider, no enums — string fields with documented values).

## Common Development Commands

```bash
# Backend (from backend/)
npm install
npx prisma db push        # sync schema (dev)
npx prisma generate
npm run dev               # tsx watch, http://localhost:3001
npm run build             # tsc
npx tsc --noEmit          # typecheck

# Frontend (from frontend/)
npm install
npm run dev               # http://localhost:5173
npm run build             # vite build
npm run lint
```

### Local database

```bash
docker run -d --name trustdoc-sql -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
docker exec trustdoc-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P 'YourStrong@Passw0rd' -C -Q "CREATE DATABASE trustdoc"
```

### Environment

`backend/.env`:
```env
DATABASE_URL="sqlserver://localhost:1433;database=trustdoc;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true"
PORT=3001
NODE_ENV=development
DEV_AUTH_ENABLED=true
FRONTEND_URL=http://localhost:5173
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_DEV_AUTH_ENABLED=true
```

## Product Principles

1. **Lean surface** – Dashboard, Documentation, Infrastructure, Agent, Settings. Do not re-add passwords/contracts/portal/recording features.
2. **No generative AI** – the agent is deterministic and rule-based. Do not add chatbots or LLM calls.
3. **Agent acts only with approval** – findings propose actions; `apply` executes them and writes audit logs.
4. **Conventional Commits** for git messages (feat:, fix:, docs:, chore:, …).
5. The codebase is fully typed — keep `npx tsc --noEmit` clean in `backend/`.

## Cursor Cloud specific instructions

- Start the SQL Server container (or reuse a running one) before backend work; check with `docker ps`.
- Run backend and frontend dev servers in tmux sessions for manual testing.
- Seed templates via `POST /api/templates/seed` for a populated demo.
