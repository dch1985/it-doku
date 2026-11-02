# 📚 IT-Doku - AI-Powered IT Documentation System

> A full-stack documentation platform for IT teams with tenant-aware workflows across **Automate**, **Centralize**, and **Comply**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_OpenAI-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)

---

## ✨ Features

### Automate

- **Source connector management** (`/api/automation/connectors`)
- **Generation job lifecycle** with retry/cancel/approve controls (`/api/automation/jobs/*`)
- **Suggestion review loop** (`/api/automation/suggestions/:id`)
- **Queue-mode execution** with `memory` or `servicebus` provider

### Centralize

- **Tenant-aware global search** across documents and knowledge nodes (`/api/search`)
- **Knowledge node CRUD** with document linking and tenant-scoped orphan handling (`/api/knowledge`)
- **Assistant conversations + traces** with citation payloads (`/api/assistant`)

### Comply

- **Template schema management** (`/api/compliance/schemas`)
- **Annotations and trace links** for evidence chains (`/api/compliance/annotations`, `/api/compliance/trace-links`)
- **Quality findings lifecycle** (`/api/compliance/quality/check`, `/api/compliance/quality/findings/:id`)
- **Review workflow orchestration** (`/api/compliance/reviews`)

### Shared platform capabilities

- Rich document editing (TipTap), templates, tenant-scoped document CRUD
- Analytics aligned to Automate/Centralize/Comply (`/api/analytics`)
- GitHub read APIs and repository content retrieval (`/api/github/*`)
- Command palette (`Ctrl+K`), responsive UI, dark mode

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
- npm
- SQL Server-compatible `DATABASE_URL` (see `backend/env.sample`)
- Optional: Azure OpenAI and GitHub token for AI/GitHub features

### 1) Install workspace dependencies

```bash
git clone https://github.com/dch1985/it-doku.git
cd it-doku
npm install
```

### 2) Configure backend

```bash
cd backend
cp env.sample .env

# run migrations / client
npx prisma migrate dev --name init
npx prisma generate

# start backend
npm run dev
```

### 3) Configure frontend

```bash
cd ../frontend
cp env.sample .env
npm run dev
```

### Local defaults

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002`
- Health check: `GET http://localhost:3002/api/health`

> `frontend/env.sample` and most frontend hooks assume `VITE_API_URL=http://localhost:3002/api`.

---

## 📚 Project Structure

```text
it-doku/
├── backend/
│   ├── env.sample
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.ts                  # mounted API surface
│       ├── routes/
│       │   ├── automation.ts         # Automate APIs
│       │   ├── assistant.ts          # Centralize assistant APIs
│       │   ├── compliance.ts         # Comply APIs
│       │   ├── analytics.ts          # KPI aggregation
│       │   ├── knowledge.ts          # knowledge node CRUD
│       │   └── search.ts             # global search (docs + knowledge)
│       ├── services/
│       ├── middleware/
│       └── workers/automation.worker.ts
├── frontend/
│   ├── env.sample
│   └── src/
│       ├── pages/                    # Dashboard, Analytics, domain pages
│       ├── hooks/                    # useAutomation/useCompliance/...
│       ├── components/
│       ├── stores/
│       └── layouts/
└── docs/
    ├── DEPLOYMENT.md
    ├── TROUBLESHOOTING.md
    └── AI_TRANSFORMATION_ROADMAP.md
```

---

## 🔌 API Endpoints

### Route-guard summary

- **Auth + tenant middleware:** `/api/analytics`, `/api/search`, `/api/assistant`, `/api/automation`, `/api/compliance`, `/api/knowledge`
- **Tenant middleware (no route-level auth middleware):** `/api/documents`, `/api/templates`
- **Auth middleware (no tenant middleware):** `/api/tenants`
- **No route-level auth/tenant middleware:** `/api/chat`, `/api/github`, `/api/upload`

### Core utility endpoints

- `GET /api/health`
- `GET /api/docs`
- `POST /api/chat`

### Automate interfaces

- `GET|POST /api/automation/connectors`
- `PATCH /api/automation/connectors/:id`
- `GET|POST /api/automation/jobs`
- `GET /api/automation/jobs/:id`
- `POST /api/automation/jobs/:id/approve|retry|cancel`
- `GET /api/automation/suggestions`
- `PATCH /api/automation/suggestions/:id`

### Centralize interfaces

- `GET|POST|PATCH|DELETE /api/knowledge`
- `GET /api/search?q=<query>&type=documents|knowledge`
- `GET /api/assistant/conversations`
- `POST /api/assistant/query`
- `GET /api/assistant/traces`

### Comply interfaces

- `GET|POST /api/compliance/schemas`
- `GET|POST /api/compliance/annotations`
- `GET|POST /api/compliance/trace-links`
- `GET /api/compliance/quality/findings`
- `PATCH /api/compliance/quality/findings/:id`
- `POST /api/compliance/quality/check`
- `GET|POST /api/compliance/reviews`
- `PATCH /api/compliance/reviews/:id`

### GitHub interfaces

- `GET /api/github/repos/:username`
- `GET /api/github/repos/:owner/:repo/readme`
- `GET /api/github/repos/:owner/:repo/structure?path=...`
- `GET /api/github/repos/:owner/:repo/file?path=...`
- `GET /api/github/search?q=...`

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

Use the detailed runbook in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:

- backend/frontend production env configuration
- queue mode selection (`memory` vs `servicebus`)
- worker startup expectations
- post-deploy smoke tests for Automate/Centralize/Comply flows

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
- [AI Transformation Roadmap](docs/AI_TRANSFORMATION_ROADMAP.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)

## 📧 Support

For support, email driss.chaouat@example.com or open an issue on GitHub.

---

<p align="center">Made with ❤️ by Driss Chaouat</p>
