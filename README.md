# 📚 IT-Doku - AI-Powered IT Documentation System

> A modern, full-stack enterprise documentation platform with tenant-aware workflows for Automate, Centralize, and Comply.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_OpenAI-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)

---

## ✨ Features

### 🎯 Core Features

- **📝 Rich Text Editor** - Full-featured document editor with TipTap
- **🤖 AI Chat Assistant** - Powered by Azure OpenAI GPT-4
- **📁 File Management** - Upload, manage, and download attachments (PDF, Word, Excel, Images)
- **🔍 Command Palette** - Quick navigation with `Ctrl+K`
- **📊 Analytics Dashboard** - Detailed insights and statistics
- **🌙 Dark Mode** - Beautiful dark/light theme support
- **📱 Responsive Design** - Works seamlessly on all devices

### 🚀 Advanced Features

- **GitHub Integration** - Import repositories and README files
- **Version History** - Track all document changes
- **Export Options** - Export to PDF, Markdown, or JSON
- **Templates System** - Pre-built documentation templates
- **Real-time CRUD** - Instant database synchronization
- **Search & Filter** - Find documents quickly
- **AI Automation Pipeline** - Connectoren, Generation Jobs & Update-Vorschläge
- **Compliance Quality Layer** - Annotationen, Trace Links & automatisierte Findings

---

## 🛠️ Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for blazing-fast development
- **shadcn/ui** + Tailwind CSS for beautiful UI
- **TipTap** for rich text editing
- **Recharts** for data visualization
- **Sonner** for toast notifications

### Backend

- **Express.js** with TypeScript
- **Prisma ORM** for database management
- **SQL Server** for data persistence (Azure SQL)
- **Azure AD B2C** for authentication
- **JWT** for token validation
- **Multer** for file uploads
- **Azure OpenAI** for AI capabilities
- **Octokit** for GitHub API integration

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure SQL Server (or compatible SQL Server database)
- Azure AD B2C App Registration (for authentication)
- Azure OpenAI API key (optional, for AI features)
- GitHub Personal Access Token (optional, for GitHub integration)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/dch1985/it-doku.git
cd it-doku

# Install backend dependencies
cd backend
npm install

# Create .env file
cp env.sample .env

# Configure environment variables
# DATABASE_URL=sqlserver://...
# AZURE_OPENAI_KEY=your_key_here (optional)
# AZURE_OPENAI_ENDPOINT=your_endpoint_here
# AZURE_TENANT_ID=your_tenant_id
# AZURE_CLIENT_ID=your_client_id
# AUTOMATION_QUEUE_AUTORUN=false
# AUTOMATION_RUN_IMMEDIATE=true
# AUTOMATION_QUEUE_PROVIDER=memory  # oder "servicebus" für Azure Service Bus
# AZURE_SERVICE_BUS_CONNECTION_STRING=... (optional, wenn Azure Service Bus genutzt wird)
# AZURE_SERVICE_BUS_QUEUE_NAME=... (Queue-Name bei Service Bus Provider)
# GITHUB_TOKEN=your_github_token_here (optional)

# Run Prisma migrations
npx prisma migrate dev --name init
npx prisma generate

# Start backend server
npm run dev
```

### Frontend Setup

```bash
# Install frontend dependencies
cd ../frontend
npm install

# Create .env file
cp env.sample .env

# Configure environment variables
# Edit .env and add:
# VITE_API_URL=http://localhost:3002/api
# VITE_AZURE_CLIENT_ID=your_client_id
# VITE_AZURE_TENANT_ID=your_tenant_id

# Start development server
npm run dev
```

The application will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002`
- Health Check: `http://localhost:3002/api/health`

---

## 📚 Project Structure

```
it-doku/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── automation.ts  # Connector/job/suggestion workflows
│   │   │   ├── compliance.ts  # Findings, annotations, reviews
│   │   │   ├── knowledge.ts   # Knowledge node CRUD
│   │   │   ├── analytics.ts   # KPI aggregation
│   │   │   ├── search.ts      # Global document + knowledge search
│   │   │   └── assistant.ts   # Conversation + trace endpoints
│   │   ├── services/          # Business logic
│   │   ├── workers/           # Automation worker entrypoint
│   │   ├── lib/               # Queue + OpenAI helpers
│   │   └── index.ts           # Server entry point
│   └── uploads/               # File storage directory
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── SearchBar.tsx
│   │   │   └── TenantSelector.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── DocumentDetail.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/            # API + feature hooks
│   │   ├── stores/           # State management
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
│
└── README.md
```

---

## 🔌 API Endpoints

### Core Platform

- `GET /api/health` - Service health and OpenAI config flag
- `GET /api/docs` - Minimal API info payload
- `GET /api/auth/*` - Auth/session endpoints
- `GET /api/tenants` - Tenant membership context
- `GET|POST|PUT|DELETE /api/documents` - Document CRUD
- `GET|POST /api/templates` - Template listing and creation
- `GET /api/github/*` - GitHub import helpers
- `POST|GET|DELETE /api/upload/*` - File upload lifecycle

### Automate (`/api/automation`)

- `GET|POST /connectors` - List or create source connectors
- `PATCH /connectors/:id` - Toggle connector activation (`isActive`)
- `GET|POST /jobs` - List jobs or create generation jobs
- `GET /jobs/:id` - Job details with findings + suggestions
- `POST /jobs/:id/{approve|retry|cancel}` - Job control actions
- `GET /suggestions` - List update suggestions
- `PATCH /suggestions/:id` - Set suggestion status (`APPLIED` / `DISMISSED`)

### Centralize (`/api/assistant`, `/api/knowledge`, `/api/search`)

- `GET /assistant/conversations` - Conversation history (tenant/user scope)
- `POST /assistant/query` - Ask question and persist trace + citations
- `GET /assistant/traces` - Recent audit traces
- `GET|POST /knowledge` - List/create knowledge nodes
- `PATCH|DELETE /knowledge/:id` - Update/remove knowledge node
- `GET /search?q=<term>&type=<documents|knowledge>` - Ranked global search

### Comply (`/api/compliance`)

- `GET|POST /schemas` - Compliance template schemas
- `GET|POST /annotations` - Structured document annotations
- `GET|POST /trace-links` - Requirement/control traceability links
- `GET /quality/findings` - Quality findings
- `PATCH /quality/findings/:id` - Resolve/reopen findings
- `POST /quality/check` - Run synchronous quality checks for one document
- `GET|POST /reviews` - Review request workflow
- `PATCH /reviews/:id` - Update review status/comments

### Analytics

- `GET /api/analytics` - Aggregated Automate/Centralize/Comply KPIs

> **Tenant context:** Most non-public routes expect `X-Tenant-ID` (or `X-Tenant-Slug`).
> In development mode (`NODE_ENV=development` or `DEV_AUTH_ENABLED=true`), tenantless access is partially relaxed.

---

## 🎨 Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Document Editor

![Editor](docs/screenshots/editor.png)

### AI Chat

![Chat](docs/screenshots/chat.png)

### File Upload

![Upload](docs/screenshots/upload.png)

---

## 🚀 Deployment

### Backend

1. Deploy `backend/` as a Node service.
2. Set required env vars (`DATABASE_URL`, auth config, OpenAI config as needed).
3. Choose automation execution mode:
   - **Synchronous local mode:** `AUTOMATION_RUN_IMMEDIATE=true`
   - **Queue auto-consume mode:** `AUTOMATION_QUEUE_AUTORUN=true`
   - **External worker mode:** `AUTOMATION_QUEUE_PROVIDER=servicebus` + worker process
4. Run Prisma migrate/generate during release.

### Frontend

1. Deploy `frontend/` (Vite build).
2. Set `VITE_API_URL` to backend base URL (with or without `/api`; both are supported by frontend URL helpers).
3. Ensure auth app registration values are configured for target environment.

### Automation Worker Runbook

```bash
cd backend

# Process a single job manually
npm run automation:job -- <jobId>

# Run long-lived queue worker
npm run automation:worker
```

> `AUTOMATION_QUEUE_PROVIDER=memory` is best for local development.
> `AUTOMATION_QUEUE_PROVIDER=servicebus` requires `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME`.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Driss Chaouat**

- GitHub: [@dch1985](https://github.com/dch1985)
- Role: IT Consultant - Microsoft 365 Cloud Services

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TipTap](https://tiptap.dev/) for the rich text editor
- [Prisma](https://www.prisma.io/) for the excellent ORM
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) for AI capabilities

---

## 📚 Documentation

### Implementation Guides

- [Phase 1 & 2: Authentication & Multi-Tenancy](docs/PHASE_1_2_IMPLEMENTATION.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>
