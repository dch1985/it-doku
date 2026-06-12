# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Trust Doc

Complete reboot of the product as **Trust Doc**: a focused, modern IT documentation tool with an
agentic, rule-based AI instead of a chat bot.

### Added
- **Agent skill engine** (`backend/src/agent/`): deterministic, traceable skills with persisted
  run history (steps, findings, actions)
  - *Coverage Analysis* - finds assets with missing required documentation, optional auto-fix
  - *Health Audit* - checks required sections, placeholders, substance and review freshness
  - *Asset Doc Generator* - generates structured drafts pre-filled from the inventory
- **Expert knowledge base** (`backend/src/agent/knowledge.ts`): required sections per document
  category, review intervals, coverage rules per asset type, document skeleton generator
- **Infrastructure inventory**: lightweight asset management (servers, network, storage,
  applications) feeding the agent
- **Review workflow**: "Mark reviewed" resets the freshness clock; the agent flags stale
  documents as "Needs review"
- **New design system**: indigo-based theme, dark sidebar, Inter typeface, light/dark mode
- SQLite for zero-config development; seed script with a realistic demo environment

### Removed
- AI chat bot (ChatSidebar, GlobalChat, conversations, Azure OpenAI streaming)
- Feature overload: password vault, contracts, customer portals, process recordings, network
  discovery, knowledge graph, compliance module, automation queue, GitHub import, file uploads,
  multi-tenancy, Azure AD authentication
- Legacy frontends (`frontend-old/`, `legacy/`) and stale setup/deployment guides

### Changed
- Backend reduced to a focused API: documents, assets, agent, stats
- Frontend rebuilt with 6 pages: Dashboard, Documents, Document editor, Infrastructure, Agent,
  Settings
- Frontend dependencies cut from ~50 to ~20 packages

## [1.0.0] - 2025-01

### Added
- Initial project setup (IT-Doku): document management, AI chat assistant, file upload,
  GitHub integration, template system, TipTap editor, dark mode, analytics dashboard
