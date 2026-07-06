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

## 🔌 API Endpoints (mounted in `backend/src/index.ts`)

### System / Ops

- `GET /api/health` - API health check
- `GET /api/docs` - Minimal API metadata
- `GET /api/analytics` - KPI aggregates for Automate, Centralize, Comply
- `GET /api/search?q=<query>&type=<documents|knowledge>` - ranked global search

### Authentication & Tenant Context

- `POST /api/auth/dev-login` - development login helper
- `GET /api/auth/me` - current user
- `POST /api/auth/logout` - logout
- `GET /api/auth/verify` - token verification
- `GET /api/tenants` / `GET /api/tenants/:id` / `POST /api/tenants` / `PATCH /api/tenants/:id`

### Core Documentation

- `GET /api/documents`, `POST /api/documents`, `GET|PUT|DELETE /api/documents/:id`
- `GET|POST /api/templates`, `GET|PUT|DELETE /api/templates/:id`, `POST /api/templates/:id/use`
- `POST /api/upload` / `GET /api/upload/document/:documentId` / `GET|DELETE /api/upload/:id`
- `POST /api/chat` - direct chat endpoint
- `GET /api/github/repos/:username`
- `GET /api/github/repos/:owner/:repo/readme`
- `GET /api/github/repos/:owner/:repo/structure`
- `GET /api/github/repos/:owner/:repo/file`
- `POST /api/github/repos/:owner/:repo/import`
- `GET /api/github/search`

### Automate (`/api/automation`)

- `GET|POST /api/automation/connectors`, `PATCH /api/automation/connectors/:id`
- `GET|POST /api/automation/jobs`, `GET /api/automation/jobs/:id`
- `POST /api/automation/jobs/:id/approve`, `POST /api/automation/jobs/:id/retry`, `POST /api/automation/jobs/:id/cancel`
- `GET /api/automation/suggestions`, `PATCH /api/automation/suggestions/:id`

### Comply (`/api/compliance`)

- `GET|POST /api/compliance/schemas`
- `GET|POST /api/compliance/annotations`
- `GET|POST /api/compliance/trace-links`
- `GET /api/compliance/quality/findings`, `PATCH /api/compliance/quality/findings/:id`, `POST /api/compliance/quality/check`
- `GET|POST /api/compliance/reviews`, `PATCH /api/compliance/reviews/:id`

### Centralize (`/api/knowledge`, `/api/assistant`)

- `GET|POST /api/knowledge`, `PATCH|DELETE /api/knowledge/:id`
- `GET /api/assistant/conversations`
- `POST /api/assistant/query`
- `GET /api/assistant/traces`

> **Tenant scope:** Most business endpoints rely on tenant context (`X-Tenant-ID` or `X-Tenant-Slug`).
> In development, missing tenant headers are tolerated when `NODE_ENV=development` or `DEV_AUTH_ENABLED=true`.

---

## 🔁 Operational Workflows (Automate · Centralize · Comply)

### 1) Automate: connector → job → suggestion

1. Create or enable a connector (`POST /api/automation/connectors`, optional `PATCH .../connectors/:id`).
2. Start a generation job (`POST /api/automation/jobs`) with intent (`CREATE`, `UPDATE`, `SUMMARY`, `QUALITY`) and optional `documentId`/`connectorId`.
3. Track state in `GET /api/automation/jobs` (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
4. Manage outcomes:
   - Retry failures (`POST /api/automation/jobs/:id/retry`)
   - Cancel active jobs (`POST /api/automation/jobs/:id/cancel`)
   - Mark completed jobs as approved (`POST /api/automation/jobs/:id/approve`)
   - Resolve suggestions via `PATCH /api/automation/suggestions/:id` (`APPLIED` or `DISMISSED`)

Quick API example:

```bash
curl -X POST http://localhost:3002/api/automation/jobs \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "intent": "UPDATE",
    "title": "Refresh backup runbook",
    "documentId": "<document-id>",
    "payload": { "source": "nightly_sync" }
  }'
```

### 2) Centralize: knowledge nodes + assistant citations

1. Store curated knowledge snippets in `POST /api/knowledge` (optional `documentId` linkage).
2. Use `GET /api/search?...&type=knowledge` for indexed discovery.
3. Ask the assistant via `POST /api/assistant/query`; responses include citations from both documents and knowledge nodes.
4. Audit answer history through `GET /api/assistant/traces`.

### 3) Comply: schema → annotation → trace link → quality/review

1. Define template constraints (`POST /api/compliance/schemas`).
2. Attach structured annotations (`POST /api/compliance/annotations`), e.g. `REQ-ID`.
3. Build traceability (`POST /api/compliance/trace-links`) between requirements, controls, docs, and evidence.
4. Run checks (`POST /api/compliance/quality/check`) and inspect findings (`GET /api/compliance/quality/findings`).
5. Resolve findings (`PATCH /api/compliance/quality/findings/:id`) and execute review workflow (`POST /api/compliance/reviews`, `PATCH /api/compliance/reviews/:id`).

---

## ⚙️ Automation Queue Runtime Modes

`automation.service.ts` behavior is controlled by env flags:

| Mode                         | `AUTOMATION_RUN_IMMEDIATE` | `AUTOMATION_QUEUE_AUTORUN` | Behavior                                                                      |
| ---------------------------- | -------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Synchronous local processing | `true`                     | `false`                    | Jobs are processed immediately during job creation/retry.                     |
| Queue-triggered processing   | `false`                    | `true`                     | Jobs are published to queue; processing starts via subscribed queue consumer. |
| Manual processing            | `false`                    | `false`                    | Jobs stay pending until you run `npm run automation:job -- <jobId>`.          |

Additional constraints:

- `AUTOMATION_QUEUE_PROVIDER=memory` is process-local (good for local dev only).
- `AUTOMATION_QUEUE_PROVIDER=servicebus` requires both `AZURE_SERVICE_BUS_CONNECTION_STRING` and `AZURE_SERVICE_BUS_QUEUE_NAME`.
- If both flags are `true`, queue autorun takes precedence.

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

### Implementation Guides

- [Phase 1 & 2: Authentication & Multi-Tenancy](docs/PHASE_1_2_IMPLEMENTATION.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>
