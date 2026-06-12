# TrustDoc

**TrustDoc** is a focused IT documentation workspace for MSPs and IT teams. It pairs NIST-grade templates with an **agentic documentation expert** — a deterministic, rule-based agent (no chatbot, no generative AI) that audits your documentation against server, network, backup and security best practice and fixes gaps with your approval.

## Features

- **Documentation** – Rich-text editing (TipTap), categories, status lifecycle (draft → review → published → archived), versioning, comments, audit history, PDF/Word/Markdown/JSON export.
- **Templates** – 11 seedable, NIST/ISO-aligned templates (server, network, backup & DR, runbook, security policy, ISMS, …) with `{{placeholder}}`-driven forms.
- **Infrastructure** – Inventory of servers, network devices and hardware, linked to documentation.
- **Documentation Agent** – Four expert skills:
  - *Documentation Health Scan*: thin content, unfilled placeholders, missing tags, stuck drafts, stale documents.
  - *Structure Compliance*: required sections per document type, with one-click skeleton remediation.
  - *Infrastructure Coverage*: flags undocumented assets and scaffolds pre-filled documents.
  - *Review Cycle Guard*: enforces the 90-day review window, prioritising security-relevant content.

  Every finding carries a concrete proposed action. Nothing changes without explicit approval; every applied action is audit-logged.

## Tech Stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui (`frontend/`)
- **Backend:** Node.js + Express + TypeScript, Prisma ORM (`backend/`)
- **Database:** SQL Server (Azure SQL or local Docker container)
- **Auth:** Azure AD (MSAL) in production, dev-login in development

## Getting Started

### 1. Database (local development)

```bash
docker run -d --name trustdoc-sql \
  -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
docker exec trustdoc-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P 'YourStrong@Passw0rd' -C -Q "CREATE DATABASE trustdoc"
```

### 2. Backend

```bash
cd backend
npm install
cat > .env <<'EOF'
DATABASE_URL="sqlserver://localhost:1433;database=trustdoc;user=sa;password=YourStrong@Passw0rd;encrypt=true;trustServerCertificate=true"
PORT=3001
NODE_ENV=development
DEV_AUTH_ENABLED=true
FRONTEND_URL=http://localhost:5173
EOF
npx prisma db push
npm run dev          # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
cat > .env <<'EOF'
VITE_API_URL=http://localhost:3001
VITE_DEV_AUTH_ENABLED=true
EOF
npm run dev          # http://localhost:5173
```

Seed the templates from the dashboard (*Templates → Seed Templates*) or via `POST /api/templates/seed`.

## API Overview

```
GET  /api/health                        Health check
CRUD /api/documents                     Documentation
CRUD /api/templates  (+ /seed, /:id/use) Templates
CRUD /api/assets                        Infrastructure inventory
GET  /api/agent/skills                  Agent capabilities
POST /api/agent/run                     Run an agent skill
GET  /api/agent/findings                Agent findings
POST /api/agent/findings/:id/apply      Approve & execute remediation
POST /api/agent/findings/:id/dismiss    Dismiss a finding
GET  /api/analytics                     Workspace overview / health score
GET  /api/search                        Global search
```

## Project Structure

```
backend/   Express API (routes, services, middleware, prisma/)
frontend/  React app (pages, hooks, components, layouts)
```

## License

MIT
