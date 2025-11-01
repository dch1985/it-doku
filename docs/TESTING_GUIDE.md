# Testing Guide - Authentication & Multi-Tenancy

## 🧪 Testing Phase 1 & 2 Features

Dieser Guide hilft dir beim Testen der neuen Authentication und Multi-Tenancy Features.

---

## 📋 Pre-Testing Checklist

### 1. Prisma Migration ausführen

```bash
cd backend
npx prisma migrate dev --name add_multi_tenancy_and_auth
npx prisma generate
```

### 2. Environment Variables prüfen

#### Backend `.env`
```env
DATABASE_URL=sqlserver://...
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_OPENAI_KEY=your-key (optional)
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:3001/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## 🔐 Option 1: Azure AD B2C Testen (Production-like)

### Setup

1. **Azure AD B2C App Registration erstellen** (falls noch nicht vorhanden)
   - Gehe zu [Azure Portal](https://portal.azure.com)
   - Azure Active Directory → App registrations → New registration
   - Name: `it-doku-app`
   - Supported account types: `Accounts in any organizational directory and personal Microsoft accounts`
   - Redirect URI: `http://localhost:5173`

2. **Configuration abrufen**
   - Nach Erstellung: **Application (client) ID** kopieren → `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** kopieren → `AZURE_TENANT_ID`

3. **Test User in Azure AD erstellen**
   - Azure AD → Users → New user
   - Erstelle einen Test-User (z.B. `test@yourdomain.com`)

### Test Flow

1. **Backend starten:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend starten:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Im Browser öffnen:** `http://localhost:5173`

4. **Login testen:**
   - Klicke auf "Log In" in der Sidebar
   - Azure AD Login-Fenster sollte erscheinen
   - Logge dich mit deinem Test-User ein
   - Nach erfolgreichem Login sollte dein Profil angezeigt werden

5. **Tenant erstellen:**
   - Nach Login, klicke auf "Create Tenant" im Tenant Selector
   - Fülle Name und Slug aus (z.B. `My Company` / `my-company`)
   - Tenant wird erstellt und du wirst als OWNER hinzugefügt

6. **Dokumente testen:**
   - Erstelle ein neues Dokument
   - Dokument sollte automatisch dem aktuellen Tenant zugeordnet sein
   - Wechsle zu einem anderen Tenant (falls vorhanden)
   - Dokument sollte nicht mehr sichtbar sein (Tenant-Isolation)

---

## 🧪 Option 2: Development Mode (Ohne Azure AD)

Falls du Azure AD B2C noch nicht konfiguriert hast, können wir einen Development-Modus implementieren.

### Development Auth Middleware erstellen

Erstelle eine alternative Auth-Middleware für lokales Testen:

```typescript
// backend/src/middleware/auth.dev.middleware.ts
export const devAuthenticate = async (req, res, next) => {
  // Development: Mock user
  req.user = {
    id: 'dev-user-id',
    email: 'dev@it-doku.local',
    name: 'Dev User',
    role: 'ADMIN',
  };
  next();
};
```

---

## 🧪 Option 3: Mock Authentication (Schnelltest)

Für schnelles Testen ohne Azure AD Setup:

### 1. Mock Auth Endpoint erstellen

```typescript
// backend/src/routes/auth.dev.ts
router.post('/dev-login', (req, res) => {
  // Development only!
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const mockUser = {
    id: 'dev-user-id',
    email: 'dev@it-doku.local',
    name: 'Dev User',
    role: 'ADMIN',
  };
  
  // Return mock token (nur für Development)
  res.json({
    token: 'dev-token',
    user: mockUser,
  });
});
```

### 2. Development Auth Provider

```typescript
// frontend/src/contexts/DevAuthContext.tsx
// Mock auth provider for development testing
```

---

## 📝 Test Szenarien

### Test 1: Authentication Flow

1. ✅ Öffne Frontend
2. ✅ Klicke auf "Log In"
3. ✅ Azure AD Login erscheint
4. ✅ Login mit Test-User
5. ✅ User-Profil wird in Sidebar angezeigt
6. ✅ Logout funktioniert

### Test 2: Tenant Creation

1. ✅ Nach Login, erstelle einen neuen Tenant
2. ✅ Tenant wird in Tenant Selector angezeigt
3. ✅ Du bist als OWNER des Tenants markiert

### Test 3: Tenant Isolation

1. ✅ Erstelle Dokument in Tenant A
2. ✅ Wechsle zu Tenant B
3. ✅ Dokument aus Tenant A sollte nicht sichtbar sein
4. ✅ Erstelle Dokument in Tenant B
5. ✅ Wechsle zurück zu Tenant A
6. ✅ Dokument aus Tenant B sollte nicht sichtbar sein

### Test 4: Multi-User Tenant

1. ✅ Erstelle Tenant
2. ✅ Lade einen zweiten User ein (manuell via API)
3. ✅ Beide User sollten Zugriff auf gleiche Dokumente haben
4. ✅ User sollten nur Dokumente ihres Tenants sehen

---

## 🔧 Troubleshooting

### Problem: "No token provided"

**Lösung:** 
- Stelle sicher, dass du dich eingeloggt hast
- Prüfe Browser-Konsole für MSAL-Fehler
- Prüfe ob `VITE_AZURE_CLIENT_ID` im Frontend `.env` gesetzt ist

### Problem: "Tenant identifier required"

**Lösung:**
- Stelle sicher, dass ein Tenant ausgewählt ist
- Prüfe Tenant Selector in Sidebar
- Stelle sicher, dass `X-Tenant-ID` Header gesendet wird

### Problem: "Azure AD Login funktioniert nicht"

**Lösung:**
- Prüfe Azure AD B2C Konfiguration
- Prüfe Redirect URI in Azure Portal
- Prüfe Browser-Konsole für Fehler
- Prüfe ob `VITE_AZURE_TENANT_ID` korrekt ist

---

## 📊 Test User Empfehlungen

### Für Azure AD B2C:

1. **Admin User:**
   - Email: `admin@yourdomain.com`
   - Role: `ADMIN` oder `OWNER`
   - Verwendung: Für Tenant-Erstellung und Administration

2. **Regular User:**
   - Email: `user@yourdomain.com`
   - Role: `USER` oder `MEMBER`
   - Verwendung: Für normale Dokumentations-Arbeit

3. **Viewer User:**
   - Email: `viewer@yourdomain.com`
   - Role: `VIEWER`
   - Verwendung: Für read-only Zugriff

---

## 🚀 Quick Start (Ohne Azure AD - Development Mode)

Falls du schnell testen möchtest ohne Azure AD Setup:

1. **Development Mode aktivieren:**
   ```env
   # backend/.env
   NODE_ENV=development
   DEV_MODE=true
   ```

2. **Backend starten** (verwendet Mock-Auth im Dev-Mode)

3. **Frontend starten** (verwendet Dev-Auth-Provider)

---

**Nächste Schritte:** Soll ich einen Development-Mode Auth-Provider implementieren, damit du ohne Azure AD Setup testen kannst?

