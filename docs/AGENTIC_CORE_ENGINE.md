# Agentic Core Engine

This document describes the agentic core engine that turns the product from a
**generative** documentation tool (write prose with GPT) into an **agentic**
IT-documentation engine (gather evidence from real systems, document it, prove
it, and detect drift).

> The differentiator is not "AI writes documentation". That is commodity. The
> differentiator is: **documentation that is traceable to a source and stays
> verified against reality.**

## Why this exists

The previous AI layer had three problems:

1. **Generative & context-free.** The chat sent a static system prompt to Azure
   OpenAI with no access to the tenant's own data. The "assistant" was actually
   SQL `LIKE` search stitched into fixed text blocks — no model involved.
2. **A fake automation engine.** `generateDocumentDraft` returned a hard-coded
   Markdown skeleton; "quality checks" were three `String.includes` calls.
3. **A broken foundation.** The automation/assistant/compliance services
   referenced ten Prisma models that did not exist in any schema, so those
   routes crashed at runtime.

The engine below fixes the foundation and replaces the generative core with an
agent that acts through typed tools and records evidence.

## The four layers

```
┌─────────────────────────────────────────────────────────────┐
│ Skills        versioned procedures (server-doc, drift-check) │  core/skills
│               allowed tools · output contract · validators   │
├─────────────────────────────────────────────────────────────┤
│ Agent runtime plan → act → observe → verify, persisted as    │  core/agent
│               AgentRun · AgentStep · Evidence                │
├─────────────────────────────────────────────────────────────┤
│ Tools         typed, read-only access to the tenant's data   │  core/tools
│               (documents, assets, network, contracts, KG)    │
├─────────────────────────────────────────────────────────────┤
│ LLM gateway   one client · tool-calling · token accounting   │  core/llm
└─────────────────────────────────────────────────────────────┘
```

### 1. LLM gateway — `backend/src/core/llm/`
A single entry point for every model call (`gateway.ts`). Supports `complete()`
(with tool-calling and usage), `stream()` (chat UI), reports `isConfigured()`,
and degrades gracefully when no credentials are set. Per-tenant token usage is
recorded via `usage.ts` into the `LlmUsage` table. This replaces the three
ad-hoc OpenAI clients that previously lived in `chat.ts`, `analyze.ts`, and the
`openai.client.ts` placeholder.

### 2. Tools — `backend/src/core/tools/`
The agent never reads the database directly and never invents facts. It calls
**read-only** tools, each of which can emit **Evidence** (a source reference + a
data snapshot + a hash). Shipped tools, all scoped to the tenant:

| Tool | Source |
| --- | --- |
| `search_documents`, `get_document` | existing documentation |
| `list_assets`, `get_asset` | CMDB / `Asset` |
| `list_network_devices` | network discovery / `NetworkDevice` |
| `list_contracts_expiring` | `Contract` |
| `search_knowledge` | knowledge graph / `KnowledgeNode` |

Connector tools (`msgraph.*` for Entra ID/Intune, `network.scan`, `github.*`)
plug into the same registry — that is where the `SourceConnector` model becomes
a real implementation instead of a config row.

### 3. Agent runtime — `backend/src/core/agent/`
`runtime.ts` runs the loop: the model plans, requests tool calls, the runtime
executes them, records evidence, feeds results back, and repeats until the model
produces a final answer (bounded by a step budget). Everything is persisted:

- **`AgentRun`** — one execution (status, goal, tokens, output).
- **`AgentStep`** — the timeline (PLAN / ACT / OBSERVE / VERIFY / FINALIZE).
- **`Evidence`** — every fact a tool returned, with `reference`, `data`, and
  `dataHash`, linked back to the step that produced it.

This is what makes output **traceable**: each run carries the receipts.

### 4. Skills — `backend/src/core/skills/`
A skill is a versioned, declarative procedure (not just a prompt). It binds:

- `allowedTools` — the only tools this skill may use;
- `inputs` / `outputFields` — a typed I/O contract;
- `systemPrompt` — role + procedure;
- `validators` — deterministic, LLM-free checks (the **verify** phase);
- `complianceMapping` — e.g. `NIST SP 800-123`, `ISO 27001:A.8.1`.

Shipped skills:

| Skill | Produces | Purpose |
| --- | --- | --- |
| `server-documentation` | DOCUMENT | Belegte Server-Doku aus CMDB-Daten (NIST 800-123) |
| `drift-check` | DRIFT_REPORT | Vergleicht Doku gegen Ist-Zustand, meldet Abweichungen |
| `m365-tenant-documentation` | DOCUMENT | Connector-Vorlage (benötigt Microsoft-Graph-Connector) |

The runner (`runner.ts`) validates inputs, runs the agent with the skill's
tools, parses the structured output, runs the validators, writes `VERIFY` steps,
and — when a `documentId` is targeted — mirrors findings into `QualityFinding`
for the compliance UI. Artifact-producing skills end in `AWAITING_REVIEW`, so a
human approves before anything is published.

## API

All endpoints are under `/api/agent` (auth + tenant middleware):

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/skills` | List available skills |
| `GET` | `/skills/:id` | Skill detail |
| `POST` | `/ask` | Agentic Q&A over the tenant's own data (tool-using) |
| `POST` | `/runs` | Start a skill run (`{ skillId, input, documentId? }`) |
| `GET` | `/runs` | Recent runs for the tenant |
| `GET` | `/runs/:id` | Full run with step timeline + evidence trail |

When no LLM is configured these return `503` with a clear message; the rest of
the app keeps working.

## Data model additions

Added to `backend/prisma/schema.prisma` (SQL Server). Two groups:

- **Foundation repair** (previously referenced but missing, causing runtime
  crashes): `SourceConnector`, `GenerationJob`, `UpdateSuggestion`,
  `QualityFinding`, `ConversationTrace`, `TemplateSchema`, `Annotation`,
  `TraceLink`, `ReviewRequest`, `Attachment`.
- **Agentic engine**: `AgentRun`, `AgentStep`, `Evidence`, `LlmUsage`.

`Document` and `User` gained the back-relations required by `ReviewRequest`.

## Configuration

```env
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01
```

Apply the schema to a database:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name agentic_core_engine
```

## Roadmap status

- [x] **P0** — Schema consolidated; canonical schema is `backend/prisma/schema.prisma`.
- [x] **P0** — Unified LLM gateway with tool-calling + per-tenant token accounting.
- [x] **P1** — Tool registry + internal read tools over existing tenant data.
- [x] **P1** — Agent runtime with AgentRun/AgentStep/Evidence persistence.
- [x] **P1** — Agentic `/api/agent/ask` (replaces context-free chat for Q&A).
- [x] **P2** — Skill format, runner, validators, three reference skills.
- [ ] **P3** — Real connectors (Microsoft Graph, network scan, GitHub) as tools.
- [ ] **P3** — Drift scheduler + freshness badges + `UpdateSuggestion` diffs from runs.
- [ ] **P4** — Validators derived from `TemplateSchema`; audit-pack export.

### Follow-ups / known gaps
- The legacy routes `customerPortals.ts`, `networkDevices.ts`,
  `processRecordings.ts`, and `templates.ts` have **pre-existing** TypeScript
  errors (schema fields / `_count` includes) unrelated to this engine. They are
  not registered in `index.ts` except `templates`. Left untouched to keep this
  change focused.
- The root `schema.prisma` is the legacy PostgreSQL schema and is **not** used
  by the backend; treat `backend/prisma/schema.prisma` as canonical.
- Drift discrepancies are currently surfaced in the run output and as
  `QualityFinding`s; turning them into `UpdateSuggestion` diffs is a P3 item
  (needs the suggestion model to accept an `agentRunId` origin).
