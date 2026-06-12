# Trust Doc

> Agentic IT documentation for servers and infrastructure — focused, modern, and free of chatbots.

Trust Doc is a clean, opinionated rewrite of the IT documentation tool. It keeps the
essentials (a documentation library and a health dashboard) and replaces the generative
AI chat assistant with a set of **deterministic expert agents** that build, audit and
certify your documentation. Every agent runs on your own data and produces predictable,
reproducible results — nothing is invented.

## Why a new iteration?

- **Not overloaded.** Four focused areas: Dashboard, Documentation, AI Agents, Settings.
- **No chatbot / generative AI.** The "AI" is a library of rule-based expert skills.
- **Modern design.** A fresh brand, gradient accents, dark mode and a responsive layout.
- **Standards-aware.** Server, network, application, storage, security and backup records
  are scored against built-in Trust Doc / ISO 27001 / NIST-aligned standards.

## Agentic AI — expert skills, not a chat box

| Agent | Type | What it does |
| --- | --- | --- |
| Server Documentation Builder | Builder | Generates a complete, standardized server document from a few facts; flags anything missing instead of guessing. |
| Network Device Documenter | Builder | Produces firewall / switch / router documentation with access, routing and config-backup sections. |
| Documentation Auditor | Analyzer | Scores every record against its standard and lists missing fields & sections with an overall coverage score. |
| Compliance Mapper | Analyzer | Maps your documentation to ISO 27001 / NIST control families and reports covered controls vs. gaps. |
| Documentation Hygiene Agent | Analyzer | Catches stale, ownerless, duplicate and draft-in-production records. |

The agent logic lives in [`src/lib/agents.ts`](src/lib/agents.ts) and the documentation
standards in [`src/lib/standards.ts`](src/lib/standards.ts).

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Zustand (local persistence) · lucide-react.

Data is stored locally in the browser (`localStorage`), so the app runs fully standalone
with no backend required.

## Development

```bash
cd trust-doc
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build
```
