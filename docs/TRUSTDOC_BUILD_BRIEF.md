# Agent Build Brief — TrustDoc Marketing Site (Hut8-Style)

## 1) Ziele & Scope

- **Ziel:** Public Marketing-Website „**TrustDoc**" (SaaS IT-Dokumentation), One-Pager + Unterseiten für IT-Doku Plattform.
- **Look & Feel:** Seriös/tech-professional, großzügige Spacing, starke Hero-Sektion, „Platform"-Framing, Metrics, Resources, Security.
- **MVP-Seiten:**
  - `/` Home (Hero, Platform, Capabilities, Solutions, Metrics, Resources, Security, CTA)
  - `/platform` (Pillars: Knowledge Graph, AI Engine, Templates, Governance, Integrations)
  - `/solutions` (Tabs: MSPs, Internal IT, Cloud Admins, Security & Compliance)
  - `/pricing`
  - `/security`
  - `/resources` (Blog/News/Case Studies Übersicht + `/resources/<slug>`)
  - `/about`
  - `/contact`
- **Internationalisierung:** Englisch (en-US), technisch vorbereitet für i18n.

## 2) Tech-Stack & Standards

- **Framework:** Next.js 14 (App Router) + **Tailwind CSS** + shadcn/ui
- **Hosting/CDN:** Vercel
- **Bilder/Assets:** Next/Image, optimiert; Favicon + Social Preview
- **Analytics:** Plausible *oder* Google Analytics v4 (per ENV schaltbar)
- **SEO:** next-seo; OpenGraph, Twitter Cards; **schema.org JSON-LD**
- **Performance:** LCP-optimierte Hero-Grafik, font-display: swap, lazy images
- **Compliance:** Cookie-Banner (nur wenn GA aktiviert), Impressum/Privacy/ToS
- **Content Source:** Markdown/MDX im Repo (Contentlayer) für Resources

## 3) Design Tokens (Tailwind)

```txt
Primary: #0B5FFF (accent) / hover: #084BD3
Ink/Dark: #0D1321  | Text: #1A2433  | Muted: #667085
BG: #FFFFFF        | Section Alt: #F7F9FC
Radius: 16px (rounded-2xl), Cards shadow-md
Font: Inter, fallback system-ui
```

## 4) IA & Komponenten

- **Global:** Header (sticky, transparent→solid on scroll), Mega-Nav (Product/Platform/Solutions/Resources/Company), Footer (4-Spalten)
- **Hero:** Vollbreit, dezenter Partikel-Hintergrund, UI-Mockup (Dashboard + AI-Panel)
- **Pillar Cards:** 5 Kacheln mit Icons, Hover-Elevate
- **Capabilities Grid:** 6–8 Features
- **Solutions Tabs:** MSPs | Internal IT | Cloud Admins | Sec&Compliance
- **Metrics Band:** Counter (animate on-in-view)
- **Resources List:** Cards mit Tag, Datum, Titel
- **Security Teaser:** 3-Spalten, Link zur Detailseite
- **CTA Banner:** „Start Free Trial" + „Book a Demo"
- **Blog Post Template:** MDX, ToC, Code-Highlighting

## 5) Verbindliche Copy (EN)

### Hero
- **H1:** **Document with confidence. Operate with proof.**
- **Sub:** **TrustDoc is the documentation platform engineered for MSPs and IT teams — combining a knowledge graph, AI, and governance to deliver audit-ready documentation at scale.**
- **CTAs:** **Start Free Trial** | **Talk to Sales**

### Platform (Pillars)
- **Knowledge Graph** — Structured entities for assets, apps, services, policies
- **AI Engine** — Context-aware drafting, refactoring, gap analysis (private by design)
- **Templates & Standards** — Server, Network, M365, Policy, DR, SOP
- **Governance** — Versioning, approvals, evidence trails
- **Integrations** — Entra ID (Azure AD), Intune, CMDB, ITSM, API/Webhooks

### Capabilities
- AI-assisted authoring • Smart templates • Version history • Review workflows • RBAC & SSO • PDF/DOCX/Markdown export • API & webhooks • Audit packs

### Solutions — MSPs
- **Pain:** scattered docs, slow onboarding, audit churn
- **Outcome:** standardized client workspaces, faster onboarding, consistent deliverables

### Metrics
- **15+** prebuilt templates • **99.9%** uptime • **<60s** audit report • **EU/US** data residency

### Security
- SSO/SCIM • At-rest & in-transit encryption • EU hosting option • Audit logs • DPA

### Footer microcopy
- © 2025 TrustDoc Inc. | Privacy | Terms | DPA | Status

## 6) SEO & JSON-LD

- **Home:** Title `TrustDoc — AI-powered IT documentation for MSPs & IT teams`
- **Meta Description:** `TrustDoc unites knowledge graph, AI, and governance to deliver audit-ready IT documentation at scale.`
- **JSON-LD (Home):** `Organization`, `WebSite`, `Product`; Resources-Posts als `BlogPosting`

## 7) Integrations (Placeholder)

- Entra ID/SSO, SCIM Provisioning, Webhook Endpoints, Status Page Link

## 8) Orchestrierung: Agent-Rollen & Prompts

### A. Product Owner Agent (PO)
- *Goal:* Bewacht Scope, prüft UX gegen Hut8-Anmutung, genehmigt Copy & IA
- *Prompt Kern:* "Ensure the site mirrors a mission-led hero, platform framing, capabilities, solutions, metrics, resources, security, and CTA cadence similar to hut8.com. Keep tone tech-professional. Enforce accessibility and performance budgets (LCP < 2.5s). Approve PRs only if copy matches the brief."

### B. Tech Lead Agent
- *Goal:* Next.js Setup, CI/CD, Env-Handling, libs
- *Deliverables:* Next.js 14 App Router, Tailwind, shadcn/ui init, Contentlayer, next-seo, Plausible optional, ESLint/Prettier, Vercel config
- *Acceptance:* `pnpm build` clean; Lighthouse ≥ 90/90/95/100 (P/A/B/SEO) lokal

### C. UI/Frontend Agent
- *Goal:* Pixel-saubere Komponenten & Seiten
- *Tasks:* Implement Header/Hero/Grids/Tabs/CTA/Blog Templates, responsive, prefers-reduced-motion
- *Acceptance:* Storybook mit 8 Kernkomponenten, Axe-Checks ohne kritische Fehler

### D. Content Writer Agent
- *Goal:* Finalisiert alle Texte (oben) in EN, erweitert Unterseiten
- *Acceptance:* Konsistenter Voice/Tone, Terminologie, max. 130 Zeichen für H1+Sub im Above-the-Fold

### E. Graphics Agent
- *Goal:* Hero-Mockup (Dashboard + AI-Panel), 5 Pillar-Icons, Social OG-Image
- *Specs:* SVG/PNG, 2×/3×, <200KB pro Asset, neutraler Business-Stil

### F. QA Agent
- *Goal:* E2E (Playwright): Navigation, CTAs, Contact-Form, Blog-Rendering
- *Non-functional:* Lighthouse, Axe, CLS < 0.1, TTI < 3s (median)

## 9) Repo-Struktur (Vorschlag)

```
trustdoc-site/
  app/
    (marketing)/
      layout.tsx
      page.tsx                # Home
      platform/page.tsx
      solutions/page.tsx
      pricing/page.tsx
      security/page.tsx
      resources/page.tsx
      resources/[slug]/page.tsx
      about/page.tsx
      contact/page.tsx
  components/
    header.tsx hero.tsx pillars.tsx metrics.tsx tabs.tsx
    resource-card.tsx cta-band.tsx footer.tsx
  content/
    resources/*.mdx
  lib/
    seo.ts analytics.ts schema.ts
  public/
    images/ icons/ og.png
  styles/globals.css
  scripts/lighthouse-ci.yml
```

## 10) Acceptance Criteria (DoD)

- **Design:** Hut8-artige Informationsarchitektur, hochwertige Hero-Visuals, konsistente Spacing/Typo
- **Copy:** Obige Formulierungen implementiert; keine Blind-Lorem
- **Perf/SEO/A11y:** Lighthouse P≥90, A≥90, B≥95, SEO≥100; WCAG AA; semantische Landmarks
- **DX:** `pnpm i && pnpm dev` startet; Prettier/ESLint clean; Storybook vorhanden
- **Content:** Mind. 3 Resource-Artikel als MDX (Guide, Case Study, Release Notes)
- **Legal:** Privacy/Terms/DPA Platzhalterseiten verlinkt; Footer vollständig

## 11) Beispiel-Tasks (als Issues)

1. Init Next.js 14 + Tailwind + shadcn/ui
2. Global Layout (Header/Footer)
3. Hero Section mit Partikel-BG & Mockup
4. Pillars (Our Platform) Komponenten
5. Capabilities Grid + Icons
6. Solutions Tabs (4 Zielgruppen)
7. Metrics Counter (Intersection-Observer)
8. Resources Listing (Contentlayer + MDX)
9. Pricing Tabelle + Toggle
10. Security Seite + JSON-LD
11. SEO (next-seo) + OG
12. Analytics + Cookie Banner (opt-in)
13. Accessibility Pass (Axe) & Lighthouse
14. Playwright E2E (CTAs, Nav, Blog)
15. Vercel Pipeline + Preview URLs

## 12) Beispiel JSON für Agent-Kickoff

```json
{
  "project": "TrustDoc Marketing Site",
  "style_reference": "hut8.com (mission-led, platform framing, metrics & resources)",
  "pages": ["/", "/platform", "/solutions", "/pricing", "/security", "/resources", "/about", "/contact"],
  "stack": {"framework":"nextjs14","ui":"tailwind+shadcn","content":"mdx+contentlayer","analytics":"plausible"},
  "perf_targets":{"lcp_ms":2500,"cls":0.1,"lighthouse":{"p":90,"a":90,"b":95,"seo":100}},
  "a11y":"WCAG AA",
  "i18n":["en"],
  "assets_needed":["hero-mockup","pillar-icons","og-image"],
  "primary_ctas":["Start Free Trial","Talk to Sales"]
}
```

## 13) Integration mit IT-Doku

**Hinweis:** Dieser Brief ist für eine separate **TrustDoc Marketing Site** erstellt. 
Die vorhandene **IT-Doku Landing Page** (`frontend/src/pages/LandingPage.tsx`) kann als Basis 
für ein TrustDoc-Rebrand dienen oder als separate Marketing-Site weiterentwickelt werden.

### Option A: TrustDoc als Rebrand
- IT-Doku wird zu "TrustDoc"
- Bestehende Landing Page wird überarbeitet
- Gleiche Infrastruktur, neues Branding

### Option B: Separate TrustDoc Site
- Neue Next.js Marketing-Site
- IT-Doku bleibt intern
- TrustDoc zeigt auf IT-Doku Plattform

