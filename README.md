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
│   │   │   ├── auth.ts / tenants.ts
│   │   │   ├── documents.ts / templates.ts / upload.ts / github.ts
│   │   │   ├── assistant.ts / search.ts / analytics.ts
│   │   │   ├── automation.ts / compliance.ts / knowledge.ts
│   │   │   └── chat.ts
│   │   ├── services/          # Business logic
│   │   ├── lib/               # Utilities
│   │   ├── workers/           # Queue/worker entrypoints
│   │   └── index.ts           # Server entry point
│   └── uploads/               # File storage directory
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── ui/           # shadcn/ui components
│   │   ├── pages/            # Dashboard / Automate / Centralize / Comply
│   │   ├── hooks/            # API and state hooks
│   │   ├── stores/           # State management
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
│
└── README.md
```

---

## 🔌 API Endpoints

> **Auth & tenant context:** Most `/api/*` routes are protected and tenant-aware.  
> Send `X-Tenant-ID` (or `X-Tenant-Slug`) for tenant-scoped reads/writes. In local dev mode (`DEV_AUTH_ENABLED=true`), auth and tenant checks are relaxed for faster testing.

### Core platform
- `GET /api/health`, `GET /api/docs`
- `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/auth/verify`
- `POST /api/auth/dev-login` (development mode only)
- `GET /api/tenants`, `GET /api/tenants/:id`, `POST /api/tenants`, `PATCH /api/tenants/:id`

### Documentation + content interfaces
- `GET|POST|PUT|DELETE /api/documents[/:id]`
- `GET /api/templates`, `GET /api/templates/:id`
- `POST /api/chat`
- `GET /api/github/repos/:username`, `GET /api/github/readme/:owner/:repo`
- `POST /api/upload`, `GET /api/upload/document/:documentId`, `GET /api/upload/:id`, `DELETE /api/upload/:id`

### Assistant + knowledge graph
- `GET /api/assistant/conversations`
- `POST /api/assistant/query`
- `GET /api/assistant/traces`
- `GET /api/knowledge?documentId=<id>`
- `POST /api/knowledge`
- `PATCH /api/knowledge/:id`
- `DELETE /api/knowledge/:id`

### Automation (connectors, generation jobs, suggestions)
- `GET|POST /api/automation/connectors`
- `PATCH /api/automation/connectors/:id` (tenant-local connectors only)
- `GET|POST /api/automation/jobs`
- `GET /api/automation/jobs/:id`
- `POST /api/automation/jobs/:id/approve`
- `POST /api/automation/jobs/:id/retry`
- `POST /api/automation/jobs/:id/cancel`
- `GET /api/automation/suggestions`
- `PATCH /api/automation/suggestions/:id`

### Compliance + review workflow
- `GET|POST /api/compliance/schemas`
- `GET|POST /api/compliance/annotations`
- `GET|POST /api/compliance/trace-links`
- `GET /api/compliance/quality/findings`
- `PATCH /api/compliance/quality/findings/:id`
- `POST /api/compliance/quality/check`
- `GET|POST /api/compliance/reviews`
- `PATCH /api/compliance/reviews/:id`

### Insights + search
- `GET /api/analytics`
- `GET /api/search?q=<query>&type=<documents|knowledge>&limit=<n>`

## 🔄 Operational workflows

### Automation job lifecycle (Automate page)
1. Create or activate a source connector via `/api/automation/connectors`.
2. Create a job via `/api/automation/jobs` (`intent`, optional `documentId`, optional `connectorId`, optional `payload`).
3. Processing behavior depends on environment flags:
   - `AUTOMATION_QUEUE_AUTORUN=true`: publish to queue provider (`memory` or `servicebus`).
   - `AUTOMATION_RUN_IMMEDIATE=true`: process synchronously on create/retry.
4. Monitor and control jobs via `/api/automation/jobs`, `.../retry`, `.../cancel`, `.../approve`.
5. Resolve suggestions via `/api/automation/suggestions/:id` (`APPLIED` / `DISMISSED`).

### Compliance review lifecycle (Comply page)
1. Define reusable schema constraints in `/api/compliance/schemas`.
2. Add traceability metadata through `/api/compliance/annotations` and `/api/compliance/trace-links`.
3. Run checks via `/api/compliance/quality/check`, then resolve/reopen findings.
4. Trigger review requests via `/api/compliance/reviews` and track status transitions (`PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `REJECTED`).

## 🧰 Automation queue commands

```bash
cd backend

# One-off processing (same worker entrypoint, explicit job id)
npm run automation:job -- <jobId>

# Long-running queue listener (required for queued mode in production)
npm run automation:worker
```

Environment flags used by the automation service:
- `AUTOMATION_QUEUE_PROVIDER=memory|servicebus`
- `AUTOMATION_QUEUE_AUTORUN=true|false`
- `AUTOMATION_RUN_IMMEDIATE=true|false`
- For Service Bus mode: `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE_NAME`

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