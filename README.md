# Trust Doc

**Trust Doc** is a focused, modern documentation system for IT infrastructure. It keeps the
documentation of your servers, network gear, storage and services complete, structured and fresh -
driven by an **agentic, rule-based AI** instead of a chat bot.

## Why Trust Doc

Most IT documentation tools fail for the same two reasons: they are overloaded with features
nobody uses, and the documentation silently rots. Trust Doc solves both:

- **Deliberately small.** Four screens: Dashboard, Documents, Infrastructure, Agent. No password
  vault, no contract management, no customer portals, no chat bot.
- **An agent, not a chat.** The Trust Doc agent is an IT documentation expert encoded as rules.
  It inspects your inventory and library, reports what is wrong and fixes what it safely can.
  Every run is recorded with steps, findings and actions - fully traceable, no LLM required.

## The agent's skills

| Skill | What it does |
| --- | --- |
| **Coverage Analysis** | Cross-references the asset inventory with the document library. Servers need system + backup docs, firewalls need network + security docs, critical assets need runbooks. Optionally auto-creates pre-filled drafts for every gap. |
| **Health Audit** | Audits every document against best practice: required sections per category, unfinished placeholders (TODO/TBD), substance, and review freshness (security docs every 90 days, server docs every 180 days). Flags stale published documents as "Needs review". |
| **Asset Doc Generator** | Generates the complete documentation set for an asset (or all assets) straight from the inventory: correct structure for the asset type, facts pre-filled, open points clearly marked. |

The expert knowledge (required sections, review intervals, coverage rules per asset type) lives in
`backend/src/agent/knowledge.ts` and is easy to extend.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, TipTap editor
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** SQLite (zero-config development); swap the Prisma datasource for PostgreSQL in production

## Getting started

```bash
# 1. Install dependencies (workspace root)
npm install

# 2. Set up the backend database
cd backend
cp .env.example .env
npx prisma db push
npm run seed          # optional: realistic demo environment

# 3. Run both servers (from the repo root)
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

## API overview

```
GET    /api/health                  Health check
GET    /api/stats                   Dashboard stats (coverage, freshness, library)

GET    /api/documents               List documents (?category=&status=&q=)
POST   /api/documents               Create document
GET    /api/documents/:id           Get document
PUT    /api/documents/:id           Update document (content changes bump the version)
POST   /api/documents/:id/review    Mark reviewed (resets the freshness clock)
DELETE /api/documents/:id           Delete document

GET    /api/assets                  List assets (?type=&q=)
POST   /api/assets                  Create asset
GET    /api/assets/:id              Get asset
PUT    /api/assets/:id              Update asset
DELETE /api/assets/:id              Delete asset

GET    /api/agent/skills            List agent skills
POST   /api/agent/skills/:id/run    Execute a skill
GET    /api/agent/runs              Run history (steps, findings, actions)
GET    /api/agent/runs/:id          Single run
```

## Repository layout

```
backend/
  prisma/schema.prisma     Document, Asset, AgentRun models
  prisma/seed.ts           Demo environment seed
  src/agent/knowledge.ts   Expert rules: sections, review intervals, coverage
  src/agent/skills.ts      The three agent skills + run engine
  src/routes/              documents, assets, agent, stats
frontend/
  src/pages/               Dashboard, Documents, DocumentDetail, Infrastructure, Agent, Settings
  src/components/          App shell, badges, shadcn/ui primitives
  src/lib/                 API client, types, hash navigation
```

## License

MIT
