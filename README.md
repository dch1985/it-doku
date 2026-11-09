# 📚 IT-Doku - AI-Powered IT Documentation System

> A modern, full-stack enterprise documentation platform with AI chat, GitHub integration, and file management capabilities.

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

---

## 📚 Project Structure

```
it-doku/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── automation.ts  # Connectors, generation jobs, suggestions
│   │   │   ├── assistant.ts   # Conversations + citations
│   │   │   ├── compliance.ts  # Schemas, quality checks, reviews
│   │   │   ├── knowledge.ts   # Knowledge node CRUD
│   │   │   ├── analytics.ts   # Automate/Centralize/Comply KPIs
│   │   │   ├── search.ts      # Global search (documents + knowledge)
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
│   │   ├── pages/
│   │   │   ├── Automate.tsx  # Automation operations dashboard
│   │   │   ├── Centralize.tsx# Knowledge + assistant workflows
│   │   │   ├── Comply.tsx    # Compliance and review workflow
│   │   │   └── Analytics.tsx # KPI overview
│   │   ├── hooks/
│   │   │   ├── useAutomation.ts
│   │   │   ├── useKnowledgeNodes.ts
│   │   │   ├── useCompliance.ts
│   │   │   ├── useAssistant.ts
│   │   │   ├── useGlobalSearch.ts
│   │   │   └── useAnalytics.ts
│   │   ├── stores/           # State management
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication

- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### Tenants

- `GET /api/tenants` - List user's tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create new tenant
- `PATCH /api/tenants/:id` - Update tenant (OWNER/ADMIN only)

### Documents

- `GET /api/documents` - List all documents (filtered by tenant)
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

> **Note:** All document endpoints require `X-Tenant-ID` or `X-Tenant-Slug` header for tenant isolation.

### File Upload

- `POST /api/upload` - Upload file attachment
- `GET /api/upload/document/:documentId` - Get document attachments
- `GET /api/upload/:id` - Download attachment
- `DELETE /api/upload/:id` - Delete attachment

### AI Chat

- `POST /api/chat` - Send message to AI assistant

### GitHub Integration

- `GET /api/github/repos/:username` - List user repositories
- `GET /api/github/repos/:owner/:repo/readme` - Get repository README
- `GET /api/github/repos/:owner/:repo/structure` - Get repository tree
- `GET /api/github/repos/:owner/:repo/file?path=...` - Read repository file
- `POST /api/github/repos/:owner/:repo/import` - Import README as document

### Templates

- `GET /api/templates` - List all templates (tenant-aware)
- `GET /api/templates/:id` - Get template by ID

### Assistant / Centralize (`/api/assistant`)

- `GET /api/assistant/conversations` - List recent tenant/user conversations
- `POST /api/assistant/query` - Ask question with audience level (`BEGINNER|PRACTITIONER|EXPERT`)
- `GET /api/assistant/traces` - List latest Q&A traces with citations

### Automation / Automate (`/api/automation`)

- `GET /api/automation/connectors` / `POST /api/automation/connectors`
- `PATCH /api/automation/connectors/:id` - Toggle tenant connector (`isActive`)
- `GET /api/automation/jobs` / `POST /api/automation/jobs`
- `GET /api/automation/jobs/:id`
- `POST /api/automation/jobs/:id/retry|cancel|approve`
- `GET /api/automation/suggestions`
- `PATCH /api/automation/suggestions/:id`

### Knowledge (`/api/knowledge`)

- `GET /api/knowledge?documentId=...` - List knowledge nodes
- `POST /api/knowledge` - Create knowledge node
- `PATCH /api/knowledge/:id` - Update knowledge node
- `DELETE /api/knowledge/:id` - Delete knowledge node

### Compliance / Comply (`/api/compliance`)

- `GET|POST /api/compliance/schemas`
- `GET|POST /api/compliance/annotations`
- `GET|POST /api/compliance/trace-links`
- `GET /api/compliance/quality/findings`
- `PATCH /api/compliance/quality/findings/:id` (`RESOLVE|REOPEN`)
- `POST /api/compliance/quality/check`
- `GET|POST /api/compliance/reviews`
- `PATCH /api/compliance/reviews/:id`

### Search + Analytics

- `GET /api/search?q=...&type=documents|knowledge&limit=...`
- `GET /api/analytics`

> **Tenant scope note:** `/api/assistant`, `/api/automation`, `/api/compliance`, `/api/knowledge`, `/api/search`, and `/api/analytics` run behind auth + tenant middleware. Send `X-Tenant-ID` in frontend and API clients when targeting tenant data.

## ⚙️ Workflow Snapshot (Automate → Centralize → Comply)

1. **Automate:** create connector → create generation job → inspect findings/suggestions → retry/cancel/approve as needed.
2. **Centralize:** capture knowledge nodes (linked or orphan) and query assistant responses with citations.
3. **Comply:** add annotations/trace links → run quality checks → assign review requests and track status changes.

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

### Automation Queue & Worker

```bash
# Process a single job manually (jobId from /api/automation/jobs)
cd backend
npm run automation:job -- <jobId>

# Long-running worker process
npm run automation:worker
```

Queue execution modes:

| Mode                         | Required env flags                                                 | Behavior                                                           |
| ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Synchronous local processing | `AUTOMATION_RUN_IMMEDIATE=true`                                    | Job is processed directly in API process after creation/retry.     |
| Queue autorun                | `AUTOMATION_QUEUE_AUTORUN=true`                                    | Job is published and processed via queue abstraction.              |
| Manual/worker driven         | `AUTOMATION_RUN_IMMEDIATE=false`, `AUTOMATION_QUEUE_AUTORUN=false` | Jobs remain `PENDING` until processed by worker or manual command. |

> ⚠️ With `AUTOMATION_QUEUE_PROVIDER=memory`, queue messages are process-local. For cross-process queueing, use `servicebus` and configure `AZURE_SERVICE_BUS_CONNECTION_STRING` + `AZURE_SERVICE_BUS_QUEUE_NAME`.

### Operations & Runbooks

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [AI Transformation Roadmap](docs/AI_TRANSFORMATION_ROADMAP.md)

### Feature/Implementation Guides

- [Phase 1 & 2: Authentication & Multi-Tenancy](docs/PHASE_1_2_IMPLEMENTATION.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>
