# 📚 IT-Doku - AI-Powered IT Documentation System

> A modern, full-stack enterprise documentation platform with AI chat, GitHub integration, and file management capabilities.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_OpenAI-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)

---

## 📌 Current Implementation Baseline (Verified)

- Active application modules are `frontend/` and `backend/` (monorepo workspaces in root `package.json`).
- Frontend API target is configured via `frontend/env.sample` (`VITE_API_URL=http://localhost:3002/api`).
- Backend automation runtime is configured via `backend/env.sample` (`AUTOMATION_QUEUE_AUTORUN`, `AUTOMATION_RUN_IMMEDIATE`, `AUTOMATION_QUEUE_PROVIDER`).
- Most business endpoints are tenant-aware and expect `X-Tenant-ID` or `X-Tenant-Slug` headers (unless explicitly running local dev auth mode).

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
- Backend API: `http://localhost:3002` (or your configured `PORT`)

---

## 📚 Project Structure

```
it-doku/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── chat.ts        # AI chat endpoints
│   │   │   ├── documents.ts   # Document CRUD
│   │   │   ├── templates.ts   # Templates management
│   │   │   ├── github.ts      # GitHub integration
│   │   │   └── upload.ts      # File upload handling
│   │   ├── services/          # Business logic
│   │   ├── lib/               # Utilities
│   │   └── index.ts           # Server entry point
│   └── uploads/               # File storage directory
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── DocumentEditor.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ChatSidebar.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── DocumentDetail.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # State management
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
│
└── README.md
```

---

## 🔌 API Endpoints (Automate · Centralize · Comply)

> Source of truth: `backend/src/routes/*.ts` and related services.
>
> Most endpoints below run behind authentication + tenant middleware. Send `X-Tenant-ID` or `X-Tenant-Slug` (or run local dev auth mode for development).

### Automation (`backend/src/routes/automation.ts`)

- `GET /api/automation/connectors`
- `POST /api/automation/connectors`
- `PATCH /api/automation/connectors/:id` (toggle `isActive`; global connectors are read-only)
- `GET /api/automation/jobs`
- `POST /api/automation/jobs`
- `GET /api/automation/jobs/:id`
- `POST /api/automation/jobs/:id/retry`
- `POST /api/automation/jobs/:id/cancel`
- `POST /api/automation/jobs/:id/approve`
- `GET /api/automation/suggestions`
- `PATCH /api/automation/suggestions/:id`

### Knowledge Nodes (`backend/src/routes/knowledge.ts`)

- `GET /api/knowledge` (optional query: `documentId`)
- `POST /api/knowledge`
- `PATCH /api/knowledge/:id`
- `DELETE /api/knowledge/:id`

### Compliance (`backend/src/routes/compliance.ts`)

- `GET /api/compliance/schemas`
- `POST /api/compliance/schemas`
- `GET /api/compliance/annotations`
- `POST /api/compliance/annotations`
- `GET /api/compliance/trace-links`
- `POST /api/compliance/trace-links`
- `GET /api/compliance/quality/findings`
- `PATCH /api/compliance/quality/findings/:id`
- `POST /api/compliance/quality/check`
- `GET /api/compliance/reviews`
- `POST /api/compliance/reviews`
- `PATCH /api/compliance/reviews/:id`

### Assistant, Search, Analytics

- `GET /api/assistant/conversations`
- `POST /api/assistant/query`
- `GET /api/assistant/traces`
- `GET /api/search?q=<query>&type=<documents|knowledge>&limit=<n>`
- `GET /api/analytics`

### Other Core Interfaces

- `GET /api/documents`, `POST /api/documents`, `PUT /api/documents/:id`, `DELETE /api/documents/:id`
- `GET /api/templates`, `GET /api/templates/:id`
- `POST /api/upload`, `GET /api/upload/document/:documentId`, `GET /api/upload/:id`, `DELETE /api/upload/:id`
- `POST /api/chat`

---

## 🎨 Screenshots

Screenshot assets are maintained under `docs/screenshots/`.

See `docs/screenshots/README.md` for current capture/export guidance.

---

## 🚀 Deployment

### Backend (Railway/Heroku)

1. Push code to GitHub
2. Connect repository to Railway/Heroku
3. Set environment variables
4. Deploy!

### Frontend (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

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
- [Deployment & Operations Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>

## 🧭 Workflow & Operations Runbook

### 1) Automation Job Lifecycle

1. Register or verify a connector (`/api/automation/connectors`).
2. Create a generation job (`/api/automation/jobs`) with optional `documentId`, `connectorId`, and payload.
3. Process job using one of these runtime modes:
   - **Immediate mode**: `AUTOMATION_RUN_IMMEDIATE=true`, `AUTOMATION_QUEUE_AUTORUN=false`
   - **Queue mode (same process, memory provider)**: `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=memory`
   - **Queue mode (distributed)**: `AUTOMATION_QUEUE_AUTORUN=true`, `AUTOMATION_QUEUE_PROVIDER=servicebus`
4. Resolve outcome using:
   - Retry (`/jobs/:id/retry`)
   - Cancel (`/jobs/:id/cancel`)
   - Approve (`/jobs/:id/approve`)
   - Suggestion status updates (`/suggestions/:id`)

### 2) Knowledge Coverage Workflow

1. Create or update nodes via `/api/knowledge`.
2. Link nodes to documents when they should contribute to Assistant/Search relevance and traceability.
3. Use Analytics (`/api/analytics`) to monitor coverage (`documentsWithCoverage`, `documentsWithoutCoverage`).

### 3) Compliance Review Workflow

1. Define structure with schema endpoints (`/api/compliance/schemas`).
2. Attach requirements and controls via annotations + trace links.
3. Run quality checks (`/api/compliance/quality/check`) and resolve findings (`PATCH /quality/findings/:id`).
4. Create and update review requests (`/api/compliance/reviews`) for approval evidence.

### 4) Worker Commands

```bash
# Process a single job explicitly
cd backend
npm run automation:job -- <jobId>

# Run a long-lived worker subscriber
npm run automation:worker
```

> Tip: If both `AUTOMATION_QUEUE_AUTORUN` and `AUTOMATION_RUN_IMMEDIATE` are `false`, newly created jobs remain `PENDING` until manually processed.
