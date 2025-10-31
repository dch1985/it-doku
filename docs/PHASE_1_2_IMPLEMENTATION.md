# Phase 1 & 2 Implementation: Authentication & Multi-Tenancy

## 📋 Übersicht

Dieses Dokument beschreibt die Implementierung von **Phase 1: Authentication & Authorization** und **Phase 2: Multi-Tenancy** für das IT-Doku Projekt.

---

## 🔐 Phase 1: Authentication & Authorization

### Implementierte Features

#### Backend

1. **Authentication Middleware** (`backend/src/middleware/auth.middleware.ts`)
   - JWT Token Validation mit Azure AD B2C
   - `authenticate` Middleware für geschützte Routes
   - `optionalAuthenticate` Middleware für öffentliche Routes
   - `authorize` Middleware für Rollen-basierte Berechtigungen

2. **Auth Routes** (`backend/src/routes/auth.ts`)
   - `GET /api/auth/me` - Aktuellen authentifizierten User abrufen
   - `POST /api/auth/logout` - Logout
   - `GET /api/auth/verify` - Token-Validierung

3. **User Schema erweitert** (`backend/prisma/schema.prisma`)
   - `azureId` und `azureOID` Felder hinzugefügt für Azure AD Integration

#### Frontend

1. **AuthProvider** (`frontend/src/contexts/AuthContext.tsx`)
   - MSAL (Microsoft Authentication Library) Integration
   - User-Info vom Backend abrufen
   - Login/Logout-Funktionalität

2. **ProtectedRoute** (`frontend/src/components/ProtectedRoute.tsx`)
   - Komponente für geschützte Routen
   - Login-Prompt für nicht-authentifizierte User

3. **Login/Logout UI** (`frontend/src/layouts/MainLayout.tsx`)
   - Login-Button in Sidebar
   - User-Profil-Dropdown mit Logout
   - Avatar mit Initialen

4. **MSAL Integration**
   - `MsalProvider` in `main.tsx`
   - `AuthProvider` in `App.tsx`

### Dependencies

#### Backend
```json
{
  "jsonwebtoken": "^x.x.x",
  "jwks-rsa": "^x.x.x",
  "@types/jsonwebtoken": "^x.x.x"
}
```

#### Frontend
```json
{
  "@azure/msal-browser": "^x.x.x",
  "@azure/msal-react": "^x.x.x"
}
```

### Environment Variables

#### Backend (`.env`)
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
```

#### Frontend (`.env`)
```env
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## 🏢 Phase 2: Multi-Tenancy

### Implementierte Features

#### Backend

1. **Tenant Schema** (`backend/prisma/schema.prisma`)
   - `Tenant` Model mit Subscription-Feldern
   - `TenantMember` Model für User-Tenant-Beziehungen
   - `tenantId` zu `Document`, `Template`, `Conversation` hinzugefügt

2. **Tenant Middleware** (`backend/src/middleware/tenant.middleware.ts`)
   - `tenantMiddleware` - Tenant-Isolation für alle Requests
   - `optionalTenantMiddleware` - Für öffentliche Endpoints
   - `requireTenantRole` - Rollen-basierte Berechtigungen innerhalb Tenants

3. **Tenant-basierte Datenfilterung**
   - `Documents Routes` mit Tenant-Filterung
   - CREATE, READ, UPDATE, DELETE mit Tenant-Isolation

4. **Tenant Management Routes** (`backend/src/routes/tenants.ts`)
   - `GET /api/tenants` - Alle Tenants des Users auflisten
   - `GET /api/tenants/:id` - Tenant-Details abrufen
   - `POST /api/tenants` - Neuen Tenant erstellen
   - `PATCH /api/tenants/:id` - Tenant aktualisieren (nur OWNER/ADMIN)

#### Frontend

1. **Tenant Store** (`frontend/src/stores/tenantStore.ts`)
   - Zustand-basierter Store für Tenant-Management
   - Persistierung in localStorage

2. **Tenant Selector** (`frontend/src/components/TenantSelector.tsx`)
   - Dropdown zum Wechseln zwischen Tenants
   - Zeigt aktuelle Tenants und Rollen an
   - "Create Tenant" Button

3. **Integration in Sidebar**
   - `TenantSelector` in `MainLayout` integriert
   - Erscheint oberhalb des User-Profils

### Tenant Model Schema

```prisma
model Tenant {
  id                 String         @id @default(uuid())
  name               String
  slug               String         @unique
  description        String?
  subscriptionStatus String         @default("TRIAL")
  subscriptionPlan   String?
  subscriptionExpiresAt DateTime?
  settings           String?
  isActive           Boolean        @default(true)
  members            TenantMember[]
  documents          Document[]
  templates         Template[]
  conversations     Conversation[]
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
}

model TenantMember {
  id       String   @id @default(uuid())
  tenantId String
  tenant   Tenant   @relation(...)
  userId   String
  user     User     @relation(...)
  role     String   @default("MEMBER") // OWNER, ADMIN, MEMBER, VIEWER
  joinedAt DateTime @default(now())
  
  @@unique([tenantId, userId])
}
```

### Tenant-Isolation in Routes

Alle Routes müssen jetzt `tenantMiddleware` verwenden:

```typescript
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();
router.use(tenantMiddleware);

// Alle Queries filtern nach tenantId
router.get('/', async (req: Request, res: Response) => {
  const documents = await prisma.document.findMany({
    where: {
      tenantId: req.tenant.id // Tenant-Isolation
    }
  });
});
```

---

## 🔄 Migration & Setup

### Prisma Migration ausführen

```bash
cd backend

# Migration für Azure AD Felder
npx prisma migrate dev --name add_azure_ad_fields

# Migration für Multi-Tenancy
npx prisma migrate dev --name add_multi_tenancy

# Prisma Client regenerieren
npx prisma generate
```

### Backend starten

```bash
cd backend
npm run dev
```

### Frontend starten

```bash
cd frontend
npm run dev
```

---

## 🧪 Testing

### Authentication Test

1. **Backend Health Check**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Auth Endpoints testen**
   ```bash
   # Get current user (requires Bearer token)
   curl -H "Authorization: Bearer <token>" http://localhost:3001/api/auth/me
   ```

3. **Frontend Login testen**
   - Öffne Frontend im Browser
   - Klicke auf "Log In" in der Sidebar
   - Azure AD Login sollte erscheinen

### Multi-Tenancy Test

1. **Tenant erstellen**
   ```bash
   curl -X POST http://localhost:3001/api/tenants \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Tenant", "slug": "test-tenant"}'
   ```

2. **Tenant wechseln im Frontend**
   - Öffne Tenant Selector in Sidebar
   - Wähle einen Tenant aus
   - Dokumente sollten nach Tenant gefiltert werden

3. **Tenant-Isolation testen**
   - Erstelle Dokument in Tenant A
   - Wechsle zu Tenant B
   - Dokument sollte nicht sichtbar sein

---

## 📝 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/logout` | Logout | ⚠️ Optional |
| GET | `/api/auth/verify` | Verify token | ✅ |

### Tenant Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/tenants` | List user's tenants | ✅ | - |
| GET | `/api/tenants/:id` | Get tenant details | ✅ | Member |
| POST | `/api/tenants` | Create new tenant | ✅ | - |
| PATCH | `/api/tenants/:id` | Update tenant | ✅ | OWNER/ADMIN |

### Tenant Headers

Für tenant-spezifische Requests muss der Tenant-Identifier mitgesendet werden:

- Header: `X-Tenant-ID` oder `X-Tenant-Slug`
- Query Parameter: `?tenantId=...` oder `?tenantSlug=...`
- Subdomain: `tenant-slug.app.com` (wenn konfiguriert)

---

## 🚀 Next Steps

### Phase 3: Encryption
- AES-256 Verschlüsselung für sensitive Daten
- Certificate Pinning
- Enhanced Security Features

### Phase 4: ISO Templates
- ISO 27001, 27002, 20000 Templates
- Server, Netzwerk, Applikations-Templates

### Phase 5: ServiceNow & Jira Integration
- API-Integrationen
- Sync-Mechanismen

---

## 🐛 Troubleshooting

### Prisma Client Errors

Wenn Prisma Models nicht gefunden werden:
```bash
cd backend
npx prisma generate
```

### Tenant Middleware Errors

Wenn `req.tenant` undefined ist:
- Stelle sicher, dass `tenantMiddleware` vor den Routes verwendet wird
- Prüfe, ob Tenant-ID/Slug im Header oder Query Parameter vorhanden ist

### Authentication Errors

Wenn Login nicht funktioniert:
- Prüfe Azure AD B2C Konfiguration in `.env`
- Prüfe, ob MSAL richtig initialisiert ist
- Prüfe Browser-Konsole für Fehler

---

## 📚 Weitere Ressourcen

- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#multi-tenancy)

---

**Erstellt:** $(Get-Date -Format "yyyy-MM-dd")
**Version:** 1.0.0
**Autor:** Driss Chaouat

