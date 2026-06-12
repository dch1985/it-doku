# CLAUDE.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

**Trust Doc** is a focused IT documentation system for servers and infrastructure. Its core idea:
an **agentic, rule-based AI** (no chat bot, no generative AI) keeps documentation complete,
structured and fresh.

**Tech stack:**
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, TipTap
- **Backend:** Node.js + Express + TypeScript, Prisma ORM
- **Database:** SQLite in development (`backend/prisma/dev.db`); switch the Prisma datasource for production

## Repository Structure

```
backend/
  prisma/schema.prisma       Models: Document, Asset, AgentRun
  prisma/seed.ts             Seeds a realistic demo environment
  src/index.ts               Express app (port 3001)
  src/agent/knowledge.ts     Expert rules: required sections per category, review
                             intervals, coverage requirements per asset type,
                             document skeleton generator
  src/agent/skills.ts        Agent skills (coverage-analysis, health-audit,
                             asset-doc-generator) + run engine + persistence
  src/routes/                documents.ts, assets.ts, agent.ts, stats.ts
  src/lib/                   prisma.ts, json.ts
frontend/
  src/App.tsx                Hash-based routing + theme + QueryClient
  src/components/AppShell.tsx  Sidebar layout (Dashboard, Documents, Infrastructure, Agent, Settings)
  src/components/badges.tsx  Status/category/criticality/severity badges
  src/components/ui/         shadcn/ui primitives (button, card, dialog, input, label,
                             select, separator, skeleton, switch, textarea)
  src/pages/                 Dashboard, Documents, DocumentDetail, Infrastructure, Agent, Settings
  src/lib/                   api.ts (typed API client), types.ts, navigation.ts, utils.ts
  src/stores/themeStore.ts   Zustand theme store (light/dark, persisted)
```

## Development Commands

```bash
# Install everything (npm workspaces at the repo root)
npm install

# Backend (port 3001)
cd backend
cp .env.example .env       # PORT, DATABASE_URL, FRONTEND_URL
npx prisma db push         # create/update SQLite schema
npm run seed               # optional demo data
npm run dev                # tsx watch

# Frontend (port 5173)
cd frontend
npm run dev
npm run build              # tsc -b && vite build
npm run lint
```

## Architecture Notes

- **Agent design:** Skills are deterministic functions in `backend/src/agent/skills.ts`. Each run
  is persisted to the `AgentRun` model with `steps`, `findings` and `actions` (JSON strings).
  Domain expertise (which sections a SERVER doc needs, how often SECURITY docs must be reviewed,
  which doc categories a FIREWALL asset requires) lives in `backend/src/agent/knowledge.ts`.
  To add a skill: implement the run function, add it to the `SKILLS` registry - the frontend
  renders skill cards dynamically from `GET /api/agent/skills`.
- **No auth / no multi-tenancy:** intentionally removed to keep the tool small.
- **Routing:** simple hash navigation (`#documents`, `#document/:id`, `#infrastructure`,
  `#agent`, `#settings`) handled in `frontend/src/lib/navigation.ts`.
- **Enums as strings:** SQLite has no enums; valid values are enforced with zod in the routes and
  mirrored in `frontend/src/lib/types.ts`. Keep both in sync.
- **Versioning:** `PUT /api/documents/:id` increments `version` only when `content` changes.
  `POST /api/documents/:id/review` sets `reviewedAt` (resets the agent's freshness clock) and
  publishes the document.
- **Theming:** CSS variables in `frontend/src/index.css` (light + `.dark`), mapped in
  `tailwind.config.js`. Sidebar uses dedicated `--sidebar-*` tokens.

## Conventions

- Use Conventional Commits (feat:, fix:, docs:, …)
- Use existing shadcn/ui primitives from `src/components/ui/`; Lucide for icons
- Tailwind for styling with the `cn()` helper from `@/lib/utils`
- Path alias `@/*` → `frontend/src/*`
