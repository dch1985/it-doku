# Agent Tasks für TrustDoc Marketing Site

## Quick Reference für Agent-Orchestrator

### Projekt: TrustDoc Marketing Site (Hut8-Style)

## Phase 1: Setup (Tech Lead Agent)

### Task 1.1: Initialize Next.js 14
```bash
npx create-next-app@latest trustdoc-site --typescript --tailwind --app --src-dir --import-alias "@/*"
cd trustdoc-site
```

### Task 1.2: Install Dependencies
```bash
npm install next-seo date-fns class-variance-authority clsx tailwind-merge lucide-react
npm install -D @tailwindcss/typography prettier eslint-config-prettier
```

### Task 1.3: Install shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge tabs
```

### Task 1.4: Setup Environment
```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=trustdoc.com  # optional
```

### Task 1.5: Configure Vercel
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

**Acceptance:** `npm run build` succeeds, Lighthouse P≥90

---

## Phase 2: UI Components (Frontend Agent)

### Task 2.1: Create Header Component
**File:** `components/header.tsx`
**Features:**
- Sticky navigation with scroll effect
- Mega menu (Product/Platform/Solutions/Resources/Company)
- CTA buttons (Start Free Trial, Talk to Sales)
- Mobile hamburger menu

### Task 2.2: Create Hero Component  
**File:** `components/hero.tsx`
**Features:**
- Full-width hero section
- Animated gradient background (subtle particles)
- H1: "Document with confidence. Operate with proof."
- Sub: TrustDoc description
- Two CTAs
- Mockup image (Dashboard + AI Panel)

### Task 2.3: Create Pillars Component
**File:** `components/pillars.tsx`
**Features:**
- 5 pillar cards (Knowledge Graph, AI Engine, Templates, Governance, Integrations)
- Icons + titles + descriptions
- Hover elevate effect
- Rounded cards with shadow

### Task 2.4: Create Metrics Component
**File:** `components/metrics.tsx`
**Features:**
- 4 metrics (15+ templates, 99.9% uptime, <60s reports, EU/US residency)
- Animated counters (Intersection Observer)
- Clean typography

### Task 2.5: Create Footer Component
**File:** `components/footer.tsx`
**Features:**
- 4-column layout
- Links: Product, Platform, Solutions, Company, Resources, Legal
- Copyright: © 2025 TrustDoc Inc.
- Social links (optional)

**Acceptance:** All components render, responsive, no console errors

---

## Phase 3: Pages (Frontend Agent)

### Task 3.1: Home Page (`app/page.tsx`)
**Sections (in order):**
1. Hero
2. Platform Pillars
3. Capabilities Grid
4. Solutions Tabs
5. Metrics Band
6. Resources Teaser
7. Security Teaser
8. CTA Banner

### Task 3.2: Platform Page (`app/platform/page.tsx`)
- Detailed pillar explanations
- Architecture diagram (optional)
- Use cases

### Task 3.3: Solutions Page (`app/solutions/page.tsx`)
- Tab navigation (MSPs, Internal IT, Cloud Admins, Sec&Compliance)
- Pain points + outcomes per tab
- Customer logos (optional)

### Task 3.4: Pricing Page (`app/pricing/page.tsx`)
- Toggle (Monthly/Annual)
- 3 tiers (Starter, Professional, Enterprise)
- Feature comparison table
- CTA buttons

### Task 3.5: Security Page (`app/security/page.tsx`)
- Security features grid
- Certifications (ISO 27001, SOC 2)
- Compliance matrix
- DPA info

### Task 3.6: Resources Page (`app/resources/page.tsx`)
- Resource cards with tags
- Filter by category
- MDX content integration

### Task 3.7: Blog Post Template (`app/resources/[slug]/page.tsx`)
- MDX rendering
- Table of contents
- Code highlighting
- Share buttons

**Acceptance:** All pages load, SEO meta tags present

---

## Phase 4: Content (Content Agent)

### Task 4.1: Write Home Page Copy
Use brief Section 5 verbatim (Hero, Platform, Capabilities, Solutions, Metrics, Security)

### Task 4.2: Write Blog Posts
Create 3 MDX files:
- `content/resources/getting-started-with-trustdoc.mdx`
- `content/resources/msp-case-study.mdx`
- `content/resources/release-notes-v1.mdx`

### Task 4.3: Write Platform Page Copy
Expand pillar descriptions (300-500 words each)

### Task 4.4: Write Security Page Copy
List security features, certifications, compliance

**Acceptance:** No lorem ipsum, consistent voice, max 130 chars H1+Sub

---

## Phase 5: SEO & Analytics (Tech Lead Agent)

### Task 5.1: Setup next-seo
**File:** `lib/seo.ts`
- Default config with TrustDoc branding
- JSON-LD Organization schema
- OpenGraph + Twitter Cards

### Task 5.2: Add JSON-LD to Pages
- Home: Organization, WebSite, Product
- Resources: BlogPosting
- Platform: BreadcrumbList

### Task 5.3: Implement Analytics
**File:** `lib/analytics.ts`
- Plausible OR GA4 (env-toggle)
- Cookie banner if GA4
- Pageview tracking

**Acceptance:** Validated schemas, OG previews work

---

## Phase 6: Graphics (Graphics Agent)

### Task 6.1: Create Hero Mockup
- Dashboard UI mockup + AI Panel
- PNG, optimized
- 2×/3× variants

### Task 6.2: Create Pillar Icons
- 5 SVG icons
- Knowledge Graph, AI Engine, Templates, Governance, Integrations
- Monochrome, professional

### Task 6.3: Create OG Image
- Social sharing image
- 1200×630px
- TrustDoc branding

**Acceptance:** All assets <200KB, loaded correctly

---

## Phase 7: QA (QA Agent)

### Task 7.1: Accessibility Audit
```bash
npm run lint
npm run build
# Axe DevTools check
```

### Task 7.2: Performance Audit
```bash
npm run lighthouse:ci
```

**Targets:** LCP < 2.5s, CLS < 0.1, TTI < 3s

### Task 7.3: E2E Tests
**File:** `e2e/home.spec.ts`
- Navigation works
- CTAs clickable
- Blog posts render
- Contact form submits

### Task 7.4: Cross-Browser
- Chrome, Firefox, Safari, Edge
- Mobile (iOS Safari, Chrome Android)

**Acceptance:** Lighthouse P≥90/A≥90/B≥95/SEO≥100, Axe zero critical

---

## Phase 8: Deployment (Tech Lead Agent)

### Task 8.1: Vercel Setup
- Connect GitHub repo
- Configure env vars
- Enable preview deployments

### Task 8.2: Monitor & Iterate
- Check analytics
- Fix any issues
- A/B test CTAs

---

## Deliverables Checklist

- [ ] Next.js 14 app with all pages
- [ ] All components from Phase 2
- [ ] Complete copy (no lorem)
- [ ] SEO + JSON-LD
- [ ] Analytics integrated
- [ ] Graphics assets
- [ ] E2E tests passing
- [ ] Lighthouse ≥ 90/90/95/100
- [ ] Deployed on Vercel
- [ ] Domain connected

---

## Estimated Timeline

- **Tech Lead:** 2-3 days (setup + config)
- **Frontend Agent:** 4-5 days (UI + pages)
- **Content Agent:** 2-3 days (copy + blog)
- **Graphics Agent:** 1-2 days (assets)
- **QA Agent:** 2 days (tests + audits)
- **Total:** ~12-15 working days for MVP

