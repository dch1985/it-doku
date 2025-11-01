# 🚀 Quick Test Guide - Development Mode

## ⚡ Schnellstart ohne Azure AD Setup

Dieser Guide ermöglicht dir sofortiges Testen der Authentication und Multi-Tenancy Features **ohne Azure AD B2C Konfiguration**.

---

## 📋 Schritt 1: Environment Variables setzen

### Backend `.env`:

```env
# Development Mode aktivieren
NODE_ENV=development
DEV_AUTH_ENABLED=true

# Database (bereits vorhanden)
DATABASE_URL=sqlserver://itdokusql1969.database.windows.net:1433;database=itdokudb;user=itdokuadmin;password=Itdoku2025!456;encrypt=true;trustServerCertificate=false
```

### Frontend `.env`:

```env
# Development Mode aktivieren
VITE_DEV_AUTH_ENABLED=true

# API URL
VITE_API_URL=http://localhost:3001/api
```

---

## 📋 Schritt 2: Prisma Migration ausführen

```bash
cd backend
npx prisma migrate dev --name add_multi_tenancy_and_auth
npx prisma generate
```

Dies erstellt:
- ✅ Tenant Tabelle
- ✅ TenantMember Tabelle
- ✅ Aktualisiertes User Schema

---

## 📋 Schritt 3: Backend starten

```bash
cd backend
npm run dev
```

Du solltest sehen:
```
⚠️  Development Auth Mode ENABLED - Using mock authentication
Backend server running on http://localhost:3001
```

---

## 📋 Schritt 4: Frontend starten

```bash
cd frontend
npm run dev
```

Öffne: `http://localhost:5173`

---

## 📋 Schritt 5: Testen

### 5.1 Login (Development Mode)

1. ✅ Klicke auf **"Log In"** in der Sidebar
2. ✅ Du wirst automatisch als **Demo User** eingeloggt:
   - **Email:** `demo@it-doku.local`
   - **Name:** `Demo User`
   - **Role:** `ADMIN`

3. ✅ Du siehst dein Profil in der Sidebar

### 5.2 Tenant erstellen

1. ✅ Klicke auf **"Select Tenant"** im Tenant Selector
2. ✅ Klicke auf **"Create New Tenant"**
3. ✅ Fülle aus:
   - **Name:** `My Company`
   - **Slug:** `my-company`
4. ✅ Tenant wird erstellt und du bist als **OWNER** hinzugefügt

### 5.3 Dokumente erstellen (Tenant-Isolation testen)

1. ✅ Navigiere zu **"Documentation"**
2. ✅ Erstelle ein neues Dokument:
   - Titel: `Test Document`
   - Inhalt: `This is a test`
3. ✅ Dokument wird automatisch deinem aktuellen Tenant zugeordnet

### 5.4 Tenant-Isolation testen

1. ✅ Erstelle einen zweiten Tenant: `Test Company 2` / `test-company-2`
2. ✅ Erstelle ein Dokument in diesem Tenant
3. ✅ Wechsle zurück zu `My Company`
4. ✅ Das Dokument aus `Test Company 2` sollte **nicht** sichtbar sein
5. ✅ Wechsle zurück zu `Test Company 2`
6. ✅ Das Dokument sollte wieder sichtbar sein

---

## ✅ Erwartete Ergebnisse

### ✅ Authentication funktioniert:
- [x] Login ohne Azure AD möglich
- [x] Demo User wird automatisch erstellt
- [x] User-Profil wird angezeigt
- [x] Logout funktioniert

### ✅ Multi-Tenancy funktioniert:
- [x] Tenant kann erstellt werden
- [x] Tenant-Isolation funktioniert
- [x] Dokumente gehören zu einem Tenant
- [x] Tenant-Wechsel funktioniert

---

## 🔄 Wechsel zu Azure AD B2C (Production)

Wenn du später auf Azure AD B2C umstellen möchtest:

### Backend `.env`:
```env
NODE_ENV=production
# DEV_AUTH_ENABLED entfernen oder auf false setzen
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
```

### Frontend `.env`:
```env
# VITE_DEV_AUTH_ENABLED entfernen
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

---

## 🐛 Troubleshooting

### Problem: "No token provided"
**Lösung:** Stelle sicher, dass `DEV_AUTH_ENABLED=true` im Backend `.env` gesetzt ist.

### Problem: "Tenant identifier required"
**Lösung:** Stelle sicher, dass ein Tenant ausgewählt ist im Tenant Selector.

### Problem: "Failed to create dev user"
**Lösung:** Führe Prisma Migration aus: `npx prisma migrate dev`

### Problem: Frontend zeigt keine Dev Auth
**Lösung:** Stelle sicher, dass `VITE_DEV_AUTH_ENABLED=true` im Frontend `.env` gesetzt ist und starte den Dev-Server neu.

---

## 🎯 Nächste Schritte

Nach erfolgreichem Test:
1. ✅ Azure AD B2C konfigurieren (siehe `TESTING_GUIDE.md`)
2. ✅ Production Mode testen
3. ✅ Weitere Features implementieren

---

**Viel Erfolg beim Testen! 🚀**

