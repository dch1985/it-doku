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
- Backend API: `http://localhost:3002` (or `http://localhost:$PORT`)

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

## 🔌 API Endpoints

Tenant-scoped routes require `X-Tenant-ID` or `X-Tenant-Slug`.
In dev mode (`NODE_ENV=development` or `DEV_AUTH_ENABLED=true`) requests can run without tenant headers.

### Platform Basics
- `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/auth/verify`
- `GET /api/tenants`, `GET /api/tenants/:id`, `POST /api/tenants`, `PATCH /api/tenants/:id`
- `GET|POST|PUT|DELETE /api/documents...`
- `GET /api/templates`, `GET /api/templates/:id`
- `POST /api/upload`, `GET /api/upload/document/:documentId`, `GET|DELETE /api/upload/:id`

### Automate (`/api/automation`)
- Connectors: `GET /connectors`, `POST /connectors`, `PATCH /connectors/:id`
- Jobs: `GET /jobs`, `POST /jobs`, `GET /jobs/:id`
- Job actions: `POST /jobs/:id/approve`, `POST /jobs/:id/retry`, `POST /jobs/:id/cancel`
- Suggestions: `GET /suggestions`, `PATCH /suggestions/:id`

**Constraints**
- `POST /connectors` requires `name` + `type`.
- Global connectors (`tenantId = null`) cannot be toggled by tenants.
- Job processing behavior depends on env flags:
  - `AUTOMATION_QUEUE_AUTORUN=true` → publish to queue provider.
  - `AUTOMATION_RUN_IMMEDIATE=true` (with autorun false) → synchronous processing.
  - both false → job remains `PENDING` until retried/processed manually.

### Centralize (`/api/knowledge`, `/api/assistant`, `/api/search`)
- Knowledge nodes: `GET /api/knowledge`, `POST /api/knowledge`, `PATCH|DELETE /api/knowledge/:id`
- Assistant: `GET /api/assistant/conversations`, `POST /api/assistant/query`, `GET /api/assistant/traces`
- Search: `GET /api/search?q=<query>` (`type=documents|knowledge` optional)

**Constraints**
- Knowledge node create requires `content` + `type`.
- If `documentId` is set, the document must belong to the active tenant.
- Assistant citations include both document and knowledge sources for traceability.

### Comply (`/api/compliance`)
- Schemas: `GET /schemas`, `POST /schemas`
- Annotations: `GET /annotations`, `POST /annotations`
- Trace links: `GET /trace-links`, `POST /trace-links`
- Findings: `GET /quality/findings`, `PATCH /quality/findings/:id`, `POST /quality/check`
- Reviews: `GET /reviews`, `POST /reviews`, `PATCH /reviews/:id`

**Constraints**
- `POST /quality/check` requires `documentId`.
- Finding actions accept only `RESOLVE` or `REOPEN`.
- Review statuses accept `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`.

### Analytics
- `GET /api/analytics` returns KPI blocks for:
  - `system` (documents/templates/users),
  - `automation` (job success, connector health, suggestions),
  - `centralize` (assistant usage, knowledge coverage),
  - `comply` (open findings, review cycle, REQ-ID coverage).

---

## 🧭 Workflow Quick Start (Automate → Centralize → Comply)

### 1) Automate: Create connector + generation job
```bash
curl -X POST http://localhost:3002/api/automation/connectors \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "name": "GitHub Source",
    "type": "GIT",
    "config": { "repo": "org/repo", "branch": "main" }
  }'

curl -X POST http://localhost:3002/api/automation/jobs \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "title": "Generate runbook draft",
    "intent": "CREATE",
    "connectorId": "<connector-id>",
    "payload": { "scope": "ops", "language": "de" }
  }'
```

### 2) Centralize: Add/update knowledge nodes and query assistant
```bash
curl -X POST http://localhost:3002/api/knowledge \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "content": "Service restart requires CAB approval in production.",
    "type": "PROCESS",
    "documentId": "<optional-document-id>"
  }'

curl -X POST http://localhost:3002/api/assistant/query \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "question": "How should we handle production restart approvals?",
    "audience": "PRACTITIONER",
    "title": "Ops QA Session"
  }'
```

### 3) Comply: Run checks, resolve findings, and trigger review
```bash
curl -X POST http://localhost:3002/api/compliance/quality/check \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{ "documentId": "<document-id>" }'

curl -X PATCH http://localhost:3002/api/compliance/quality/findings/<finding-id> \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{ "action": "RESOLVE", "resolution": "Owner + review section added" }'

curl -X POST http://localhost:3002/api/compliance/reviews \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "documentId": "<document-id>",
    "reviewerId": "<user-id>",
    "comments": "Please validate ISO-27001 mapping."
  }'
```

Quality checks are currently heuristic (placeholder text, plaintext password patterns, missing review/owner hints). They are a guardrail, not a full policy engine.

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
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)
- [AI Transformation Roadmap](docs/AI_TRANSFORMATION_ROADMAP.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>
