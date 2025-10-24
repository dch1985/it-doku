# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IT-Dokumentations-Anwendung is a modern, cloud-native IT documentation management system with Microsoft Azure integration. The application enables IT teams to create, manage, and maintain documentation using intelligent templates, automated workflows, and Azure integration.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend:** Node.js + Express, TypeScript
- **Infrastructure:** Azure Static Web Apps (frontend), Azure App Service (backend), PostgreSQL (production), SQLite (development)

## Repository Structure

The repository is organized as a monorepo with three main directories at the root:

- `frontend-new/` - Modern React 19 frontend with Vite (current active frontend)
- `frontend/` - Legacy frontend (being migrated)
- `backend/` - Express.js API server

### Frontend Architecture (`frontend-new/`)

The frontend follows a **feature-based architecture** with clear separation of concerns:

```
src/
├── features/           # Feature modules (dashboard, chat, documentation, settings)
│   ├── chat/          # AI chat feature with API, components, hooks
│   ├── dashboard/     # Dashboard with components and hooks
│   ├── documentation/ # Documentation management
│   └── settings/      # Settings feature
├── shared/            # Shared code across features
│   ├── api/          # Shared API clients
│   ├── components/   # Shared components
│   ├── hooks/        # Shared React hooks
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utilities
├── components/        # Global UI components
│   └── ui/           # shadcn/ui components (button, card, dialog, etc.)
├── layouts/          # Layout components (MainLayout)
├── stores/           # Zustand state management (themeStore, sidebarStore)
├── providers/        # React context providers (QueryProvider)
├── lib/              # Library utilities (utils.ts)
└── hooks/            # Global hooks (use-mobile, use-toast)
```

**Key Architecture Patterns:**
- **Feature modules** contain their own API clients, components, and hooks
- **Shared code** is in the `shared/` directory for reusability
- **State management** uses Zustand with persistence
- **UI components** from shadcn/ui in `components/ui/`
- **Styling** with Tailwind CSS + CSS variables for theming

### Backend Architecture (`backend/`)

```
src/
├── config/       # Configuration files (database.ts)
├── controllers/  # Request handlers (document.controller.ts)
├── routes/       # Route definitions (document.routes.ts, chat.ts, analyze.ts)
├── services/     # Business logic (document.service.ts)
├── models/       # Data models
├── middleware/   # Express middleware
├── types/        # TypeScript types
└── utils/        # Utility functions
prisma/
└── schema.prisma # Database schema with Document and GeneratedDocumentation models
```

**Database Schema (Prisma):**
- **Document** model with fields: title, content, category, tags, status, priority, version
- **DocumentCategory** enum: SERVER, NETWORK, SECURITY, BACKUP, MONITORING, SOFTWARE, CODE_ANALYSIS
- **DocumentStatus** enum: DRAFT, PUBLISHED, ARCHIVED, REVIEW
- **Priority** enum: LOW, MEDIUM, HIGH, CRITICAL
- **GeneratedDocumentation** model for AI-generated code documentation

## Common Development Commands

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend-new

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server with hot reload (runs on http://localhost:3001)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start

# Format code with Prettier
npm run format

# Database commands (Prisma)
npx prisma migrate dev    # Run migrations in development
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio GUI
```

### Running Both Servers

Open two terminal windows:
- **Terminal 1:** `cd backend && npm run dev`
- **Terminal 2:** `cd frontend-new && npm run dev`

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

## Configuration

### Environment Variables

#### Backend (`.env` in `backend/`)
```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-01

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb

# Server Configuration
PORT=3001
NODE_ENV=development
```

Use `backend/.env.template` as a reference when creating a new `.env` file.

#### Frontend (`.env` in `frontend/`)
```env
VITE_API_BASE_URL=http://localhost:3001    # Development
VITE_API_BASE_URL=/api                     # Production
VITE_AZURE_CLIENT_ID=your-azure-client-id
```

## Styling & Theming

The application uses:
- **Tailwind CSS** with custom configuration in `tailwind.config.js`
- **CSS Variables** for theming (defined in `src/index.css`)
- **Dark mode** support via class strategy (`'class'` in tailwind config)
- **shadcn/ui** component library (configuration in `components.json`)

**Theme System:**
- Managed by Zustand store (`stores/themeStore.ts`)
- Supports: `'light'`, `'dark'`, `'system'`
- Persisted to localStorage
- Applied in `App.tsx` via `useEffect`

**Color System:**
All colors use HSL CSS variables (e.g., `hsl(var(--primary))`):
- Primary, secondary, accent colors
- Background, foreground, border colors
- Card, popover, muted colors
- Destructive (error) colors
- Sidebar-specific colors

## State Management

**Zustand** is used for global state management:
- `stores/themeStore.ts` - Theme preferences (light/dark/system)
- `stores/sidebarStore.ts` - Sidebar open/closed state

**TanStack Query** (React Query) is configured via `QueryProvider` for:
- Server state management
- API data fetching and caching
- Devtools available in development

## API Integration

Backend API base URL is configured via:
- Development: `http://localhost:3001`
- Production: Proxied via `/api`

**Available Endpoints:**
```
GET  /api/health          # Health check
GET  /api/docs            # API documentation
GET  /api/documents       # Get all documents
POST /api/documents       # Create document
GET  /api/documents/:id   # Get single document
PUT  /api/documents/:id   # Update document
DELETE /api/documents/:id # Delete document
```

## Component Guidelines

When working with components:
1. **Use existing shadcn/ui components** from `src/components/ui/` (button, card, dialog, etc.)
2. **Feature-specific components** go in `src/features/{feature}/components/`
3. **Shared components** used across features go in `src/shared/components/`
4. **Use Lucide icons** for iconography (configured as default in `components.json`)
5. **Apply Tailwind classes** for styling, using `cn()` utility from `@/lib/utils` for conditional classes

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json` and `vite.config.ts`:
- `@/*` → `src/*`

Example imports:
```typescript
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
```

## Design System Guidelines

Follow existing patterns from the codebase:
- **Layout:** Use `MainLayout` component with sidebar navigation
- **Spacing:** Use Tailwind spacing scale (e.g., `space-y-6`, `gap-4`)
- **Typography:** Use semantic heading tags with Tailwind typography classes
- **Responsiveness:** Mobile-first approach with responsive breakpoints (`md:`, `lg:`)
- **Dark mode:** Use Tailwind's dark mode classes when needed

## Project Goals & Roadmap

Based on `docs/TEMPLATE_SYSTEM_DESIGN.md`, the project aims to implement:
1. **Standardized Templates** - NIST-compliant documentation templates
2. **Structured Fields** - Typed, validated fields for different documentation types
3. **Change Management** - Version control and change tracking
4. **Compliance Tracking** - ISO-27001, NIST standards support
5. **AI Integration** - Azure OpenAI for documentation assistance

**Documentation Categories:**
- Server documentation
- Network documentation
- Security policies
- Backup procedures
- Monitoring setup
- Troubleshooting guides

## Database & ORM

The backend uses **Prisma ORM** with SQLite for development and PostgreSQL for production.

**Key Models:**
1. **Document** - Main documentation model with categorization, tagging, status tracking, and versioning
2. **GeneratedDocumentation** - Stores AI-generated documentation for code repositories

**Switching Databases:**
- Development: SQLite (configured in `prisma/schema.prisma`)
- Production: PostgreSQL (update `DATABASE_URL` in `.env`)

After changing the database provider in `schema.prisma`, run:
```bash
npx prisma generate
npx prisma migrate dev
```

## Important Notes

- The `frontend-new/` directory is the **active frontend** being developed
- The `frontend/` directory is the legacy version being phased out
- Backend uses `tsx watch` for development hot-reloading
- Frontend uses Vite's fast HMR for instant updates
- Use **Conventional Commits** for git messages (feat:, fix:, docs:, etc.)
- Follow existing TypeScript patterns - the codebase is fully typed
- Database schema is managed by Prisma - modify `prisma/schema.prisma` and run migrations
