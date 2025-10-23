# Template Foundation - Phase 1 Dokumentation

**Version:** 1.0.0
**Datum:** 2025-01-23
**Status:** ✅ KOMPLETT IMPLEMENTIERT

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Datenbank-Schema](#datenbank-schema)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [NIST-Template Templates](#nist-konforme-templates)
7. [Installation & Setup](#installation--setup)
8. [Verwendung](#verwendung)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## 🎯 Übersicht

**Phase 1: Template Foundation** implementiert ein vollständiges CRUD-System für IT-Dokumentationen mit Template-Unterstützung. Das System ermöglicht es, professionelle IT-Dokumentationen basierend auf NIST-konformen Vorlagen zu erstellen, zu verwalten und zu organisieren.

### Hauptfunktionen

✅ **CRUD-Operationen für Dokumente**
- Erstellen, Lesen, Aktualisieren, Löschen von IT-Dokumentationen
- Template-basierte Dokumenten-Erstellung
- Kategorisierung nach IT-Bereichen
- Status-Management (Entwurf, Prüfung, Freigegeben, Archiviert)

✅ **5 NIST-konforme Templates**
- Server-Dokumentation
- Netzwerk-Konfiguration
- Backup-Prozedur
- Incident-Report
- Change-Request

✅ **Moderne UI mit React**
- Responsive Design mit Dark Mode
- Document List mit Filtern
- Modal-basierte Formulare
- Lösch-Bestätigung

✅ **REST API mit Express & Prisma**
- TypeScript vollständig typisiert
- SQLite Datenbank
- Error Handling
- API-Dokumentation

---

## 🏗️ Architektur

### System-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App.tsx                                             │   │
│  │  ├─ DocumentList  (Liste aller Dokumente)          │   │
│  │  ├─ DocumentForm  (Erstellen/Bearbeiten)           │   │
│  │  └─ DeleteConfirmation (Löschen-Dialog)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕ HTTP/REST                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Express)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes                                              │   │
│  │  ├─ /api/documents   (Document CRUD)                │   │
│  │  └─ /api/templates   (Template Management)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  ├─ documentService  (Business Logic)               │   │
│  │  └─ templateService  (Template Logic + Seeding)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕ Prisma ORM                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Datenbank (SQLite)                           │
│  ┌──────────────┐           ┌──────────────┐                │
│  │  templates   │───────────│  documents   │                │
│  │  (Vorlagen)  │    1:N    │  (Dokumente) │                │
│  └──────────────┘           └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Backend:**
- Node.js 18+
- Express.js 4.18
- TypeScript 5.3
- Prisma ORM 5.7
- SQLite (Development) / PostgreSQL (Production ready)

**Frontend:**
- React 18
- TypeScript 5.3
- Vite 5
- Fetch API (native)

---

## 💾 Datenbank-Schema

### Prisma Schema

```prisma
model Template {
  id        String   @id @default(uuid())
  title     String
  category  String   // server, network, security, etc.
  content   String   // Template-Inhalt (Markdown)
  type      String   // documentation, procedure, report, request
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documents Document[]
}

model Document {
  id         String    @id @default(uuid())
  templateId String?   // Optional: Referenz zum Template
  title      String
  content    String    // Dokumenten-Inhalt (Markdown)
  category   String    // server, network, security, etc.
  status     String    @default("draft") // draft, review, approved, archived
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  template   Template? @relation(fields: [templateId], references: [id])
}
```

### Kategorien

| Kategorie | Beschreibung |
|-----------|-------------|
| `server` | Serveradministration |
| `network` | Netzwerk-Konfiguration |
| `security` | Sicherheit & Compliance |
| `backup` | Backup & Recovery |
| `monitoring` | System-Überwachung |
| `troubleshoot` | Troubleshooting |
| `incident` | Incident Management |
| `change` | Change Management |

### Status-Workflow

```
draft → review → approved → archived
  ↓       ↓         ↓          ↓
(Entwurf) (Prüfung) (Freigegeben) (Archiviert)
```

---

## 🔌 Backend API

### Base URL

```
Development: http://localhost:3001
Production:  https://api.your-domain.com
```

### Endpoints

#### Documents

**GET /api/documents**
- Alle Dokumente auflisten
- Query Parameters: `category`, `status`
- Response: `{ success, count, documents[] }`

**GET /api/documents/:id**
- Einzelnes Dokument abrufen
- Response: `{ success, document }`

**POST /api/documents**
- Neues Dokument erstellen
- Body: `{ title, content, category, templateId?, status? }`
- Response: `{ success, message, document }`

**PUT /api/documents/:id**
- Dokument aktualisieren
- Body: `{ title?, content?, category?, status? }`
- Response: `{ success, message, document }`

**DELETE /api/documents/:id**
- Dokument löschen
- Response: `{ success, message }`

**GET /api/documents/stats**
- Dokumenten-Statistiken
- Response: `{ success, stats: { total, byCategory, byStatus } }`

#### Templates

**GET /api/templates**
- Alle Templates auflisten
- Query Parameters: `category`, `type`
- Response: `{ success, count, templates[] }`

**GET /api/templates/:id**
- Einzelnes Template abrufen
- Response: `{ success, template }`

**POST /api/templates/seed**
- NIST-konforme Templates initialisieren
- Response: `{ success, message }`

### Beispiel-Requests

#### Dokument erstellen

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Webserver-01 Dokumentation",
    "content": "# Webserver-01\n\n## Hardware\nDell PowerEdge R640",
    "category": "server",
    "status": "draft"
  }'
```

#### Templates seeden

```bash
curl -X POST http://localhost:3001/api/templates/seed
```

#### Dokumente nach Kategorie filtern

```bash
curl http://localhost:3001/api/documents?category=server&status=approved
```

---

## 🎨 Frontend

### Komponenten-Struktur

```
frontend/src/
├── App.tsx                         # Haupt-Anwendung
├── api/
│   └── documents.ts               # API Client
├── components/
│   ├── DocumentList.tsx           # Dokumenten-Liste
│   ├── DocumentForm.tsx           # Erstellen/Bearbeiten Modal
│   ├── DeleteConfirmation.tsx     # Löschen-Dialog
│   └── Scanner.tsx                # Verzeichnis-Scanner
└── styles/
    ├── base.css                   # Basis-Styles
    ├── layout.css                 # Layout-System
    ├── components.css             # Komponenten-Styles
    └── variables.css              # CSS-Variablen
```

### Features

**DocumentList**
- Grid-basierte Darstellung
- Filter nach Kategorie und Status
- Edit/Delete Buttons
- Leere-State Handling
- Kategorie-Badges mit Farben
- Status-Badges
- Responsive Design

**DocumentForm**
- Template-Auswahl für neue Dokumente
- Markdown-Editor (Textarea)
- Kategorie & Status Dropdowns
- Validierung
- Edit-Mode Support
- Loading States

**DeleteConfirmation**
- Modal-basierter Dialog
- Warnhinweis
- Bestätigung erforderlich
- Error Handling

### Styling-System

**CSS-Variablen** (Dark Mode Support)
```css
/* Light Mode */
--bg-primary: #ffffff;
--text-primary: #1a1a1a;

/* Dark Mode */
--bg-primary: #1a1b25;
--text-primary: #e4e4e7;
```

**Responsive Breakpoints**
```css
@media (max-width: 768px) { /* Mobile */ }
@media (max-width: 1024px) { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
```

---

## 📝 NIST-Konforme Templates

### 1. Server-Dokumentation

**Kategorie:** `server`
**Typ:** `documentation`

**Struktur:**
- Allgemeine Informationen (Hostname, IP, Standort)
- Hardware-Spezifikationen
- Betriebssystem
- Installierte Software
- Netzwerkkonfiguration
- Sicherheitsmaßnahmen
- Backup-Strategie
- Wartungsplan
- Notfall-Kontakte
- Änderungshistorie

### 2. Netzwerk-Konfiguration

**Kategorie:** `network`
**Typ:** `documentation`

**Struktur:**
- Geräte-Informationen
- Standort
- Management-Zugang
- Port-Konfiguration
- VLAN-Konfiguration
- Routing
- Sicherheitseinstellungen
- QoS
- Monitoring
- Backup

### 3. Backup-Prozedur

**Kategorie:** `backup`
**Typ:** `procedure`

**Struktur:**
- Übersicht & Scope
- Backup-Strategie
- Backup-Schedule
- Prozess (Vorbereitung, Durchführung, Verifikation)
- Restore-Prozedur
- Test-Schedule
- Monitoring
- Compliance
- Disaster Recovery
- Änderungshistorie

### 4. Incident-Report

**Kategorie:** `troubleshoot`
**Typ:** `report`

**Struktur:**
- Incident-Identifikation (ID, Datum, Priorität)
- Beschreibung
- Auswirkungen
- Erste Reaktion
- Ursachenanalyse (Root Cause)
- Lösungsschritte
- Wiederherstellung
- Präventivmaßnahmen
- Lessons Learned
- Kommunikation

### 5. Change-Request

**Kategorie:** `troubleshoot`
**Typ:** `request`

**Struktur:**
- Change-Informationen
- Antragsteller
- Beschreibung & Begründung
- Implementierungsplan
- Risikobewertung
- Rollback-Plan
- Test-Plan
- Kommunikation
- Genehmigungen (CAB)
- Post-Implementation Review

---

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js 18+ ([Download](https://nodejs.org/))
- npm oder yarn
- Git

### 1. Repository klonen

```bash
git clone https://github.com/dch1985/it-doku.git
cd it-doku
```

### 2. Dependencies installieren

```bash
# Root-Level (optional)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Datenbank initialisieren

```bash
cd backend

# Prisma Client generieren
npx prisma generate

# Migration durchführen (erstellt dev.db)
npx prisma migrate dev --name init

# Templates seeden
curl -X POST http://localhost:3001/api/templates/seed
# ODER: Beim Start automatisch durch API-Call
```

### 4. Environment Variables

**backend/.env:**
```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
NODE_ENV=development
```

**frontend/.env:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

### 5. Server starten

```bash
# Backend (Terminal 1)
cd backend
npm run dev
# → http://localhost:3001

# Frontend (Terminal 2)
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 📖 Verwendung

### Workflow: Neues Dokument erstellen

1. **Frontend öffnen**: `http://localhost:5173`
2. **Plus-Button klicken** (Floating Action Button rechts unten)
3. **Optional: Template wählen**
   - Dropdown "Template verwenden"
   - Template auswählen → Inhalt wird vorausgefüllt
4. **Formular ausfüllen**
   - Titel eingeben
   - Kategorie wählen
   - Status wählen (Standard: Entwurf)
   - Inhalt bearbeiten (Markdown)
5. **"Erstellen" klicken**
6. **Dokument erscheint in der Liste**

### Workflow: Dokument bearbeiten

1. **Dokument in Liste finden**
2. **Edit-Button (Stift-Icon) klicken**
3. **Änderungen vornehmen**
4. **"Aktualisieren" klicken**

### Workflow: Dokument löschen

1. **Dokument in Liste finden**
2. **Delete-Button (Papierkorb-Icon) klicken**
3. **Bestätigung im Dialog**
4. **"Löschen" klicken**

### Filter verwenden

**Nach Kategorie filtern:**
- Dropdown "Kategorie" → Kategorie wählen

**Nach Status filtern:**
- Dropdown "Status" → Status wählen

---

## 🧪 Testing

### Backend-Tests

#### Automatisiertes Test-Script

```bash
cd backend
./test-api.sh
```

**Das Script testet:**
1. ✅ Health Check
2. ✅ Template Seeding
3. ✅ Templates abrufen
4. ✅ Dokument erstellen
5. ✅ Dokumente auflisten
6. ✅ Einzelnes Dokument abrufen
7. ✅ Dokument aktualisieren
8. ✅ Statistiken abrufen
9. ✅ Filter (nach Kategorie)
10. ✅ Dokument löschen

#### Manuelle API-Tests

```bash
# Health Check
curl http://localhost:3001/api/health

# Templates seeden
curl -X POST http://localhost:3001/api/templates/seed

# Templates auflisten
curl http://localhost:3001/api/templates

# Dokument erstellen
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"# Test","category":"server"}'

# Dokumente auflisten
curl http://localhost:3001/api/documents

# Dokument abrufen
curl http://localhost:3001/api/documents/<ID>

# Dokument aktualisieren
curl -X PUT http://localhost:3001/api/documents/<ID> \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# Dokument löschen
curl -X DELETE http://localhost:3001/api/documents/<ID>
```

### Frontend-Tests

#### Manuelles UI-Testing

**Test-Checkliste:**
- [ ] Plus-Button öffnet DocumentForm
- [ ] Template-Auswahl füllt Formular aus
- [ ] Dokument kann erstellt werden
- [ ] Dokument erscheint in Liste
- [ ] Filter funktionieren (Kategorie, Status)
- [ ] Edit-Button öffnet Formular mit Daten
- [ ] Dokument kann aktualisiert werden
- [ ] Delete-Button öffnet Bestätigung
- [ ] Dokument kann gelöscht werden
- [ ] Dark Mode funktioniert
- [ ] Responsive Design (Mobile, Tablet, Desktop)

#### Browser-Tests

**Chrome/Edge:**
- Öffne DevTools (F12)
- Network Tab: Prüfe API-Calls
- Console: Prüfe auf Fehler

**Firefox:**
- Öffne Entwickler-Tools (F12)
- Netzwerk: Prüfe Requests
- Konsole: Prüfe Logs

---

## 🚢 Deployment

### Production Build

#### Backend

```bash
cd backend
npm run build
npm start
```

**Umgebungsvariablen (Production):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/itdoku"
PORT=3001
NODE_ENV=production
```

#### Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

**Deploy `dist/` zu:**
- Azure Static Web Apps
- Netlify
- Vercel
- AWS S3 + CloudFront

### Datenbank-Migration

**Von SQLite zu PostgreSQL:**

1. **PostgreSQL-Datenbank erstellen**
```sql
CREATE DATABASE itdoku;
```

2. **Prisma Schema anpassen**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. **Migration durchführen**
```bash
npx prisma migrate deploy
```

4. **Templates seeden**
```bash
curl -X POST https://api.your-domain.com/api/templates/seed
```

---

## 📊 Statistiken

### Code-Metriken

| Bereich | Dateien | Zeilen | Beschreibung |
|---------|---------|--------|-------------|
| **Backend** | 7 | ~1500 | Services, Routes, Prisma |
| **Frontend** | 6 | ~1200 | Components, API Client |
| **Styles** | 4 | ~1100 | CSS (inkl. Document-Styles) |
| **Dokumentation** | 2 | ~800 | Dieser Guide + LOCAL_SCANNING.md |
| **Gesamt** | **19** | **~4600** | **Phase 1 komplett** |

### Features

- ✅ 5 NIST-konforme Templates
- ✅ 10 API-Endpoints
- ✅ 3 Frontend-Komponenten
- ✅ 8 Dokument-Kategorien
- ✅ 4 Status-Stufen
- ✅ Dark Mode Support
- ✅ Responsive Design
- ✅ TypeScript vollständig typisiert

---

## 🎯 Roadmap

### Phase 2: Enhanced Features

- [ ] Markdown-Preview im Editor
- [ ] Volltextsuche in Dokumenten
- [ ] Dokument-Export (PDF, Word)
- [ ] Versionskontrolle für Dokumente
- [ ] Tags/Labels für Dokumente

### Phase 3: Collaboration

- [ ] Benutzer-Authentifizierung
- [ ] Benutzer-Rollen (Admin, Editor, Viewer)
- [ ] Kommentar-System
- [ ] Dokument-Sharing
- [ ] Aktivitäts-Log

### Phase 4: Advanced

- [ ] KI-gestützte Template-Vorschläge
- [ ] Automatische Dokumenten-Generierung aus Scans
- [ ] Integration mit ITSM-Tools (ServiceNow, Jira)
- [ ] Audit-Trail & Compliance-Reports
- [ ] Multi-Tenancy Support

---

## 🐛 Troubleshooting

### Backend startet nicht

**Problem:** `Error: Cannot find module '@prisma/client'`

**Lösung:**
```bash
cd backend
npm install
npx prisma generate
```

### Datenbank-Fehler

**Problem:** `Error: P2021: Table 'documents' does not exist`

**Lösung:**
```bash
cd backend
npx prisma migrate dev
```

### Frontend kann Backend nicht erreichen

**Problem:** `Failed to fetch`

**Lösung:**
1. Prüfe ob Backend läuft: `curl http://localhost:3001/api/health`
2. Prüfe CORS-Einstellungen in `backend/src/index.ts`
3. Prüfe `.env` Datei im Frontend

### Templates nicht verfügbar

**Problem:** Template-Liste leer

**Lösung:**
```bash
curl -X POST http://localhost:3001/api/templates/seed
```

---

## 📞 Support

Bei Problemen oder Fragen:

- **GitHub Issues**: [it-doku/issues](https://github.com/dch1985/it-doku/issues)
- **Email**: dchaouat@chaouat-consulting.de
- **Dokumentation**: Dieses Dokument

---

## 📄 Lizenz

MIT License - Siehe [LICENSE](LICENSE)

---

## ✨ Credits

**Entwickelt mit:**
- React 18
- Express.js
- Prisma ORM
- TypeScript
- SQLite/PostgreSQL

**Inspiriert von:**
- NIST Cybersecurity Framework
- IT Infrastructure Library (ITIL)
- Best Practices in IT-Dokumentation

---

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**

**Version:** 1.0.0
**Letzte Aktualisierung:** 2025-01-23
