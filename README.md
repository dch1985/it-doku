# IT-Dokumentations-Anwendung

> Moderne, cloud-native Lösung für die Verwaltung von IT-Dokumentationen mit Microsoft Azure Integration

[![CI/CD Pipeline](https://github.com/dch1985/it-doku/workflows/CI%20Pipeline/badge.svg)](https://github.com/dch1985/it-doku/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Übersicht

Diese Anwendung revolutioniert die Art, wie IT-Teams ihre Dokumentationen erstellen, verwalten und pflegen. Mit intelligenten Vorlagen, automatisierten Workflows und nahtloser Azure-Integration wird das Dokumentieren von IT-Infrastrukturen und -Prozessen zum Kinderspiel.

## Hauptfunktionen

- **Intelligente Dokumentation:** Best-Practice-Vorlagen für Server, Netzwerke und Prozesse
- **CRUD-Operationen:** Vollständige Verwaltung von Dokumentationseinträgen
- **Responsive Design:** Optimiert für Desktop, Tablet und Mobile
- **Azure-Integration:** Single Sign-On über Azure Active Directory
- **Volltextsuche:** Schnelles Auffinden relevanter Informationen
- **Versionskontrolle:** Nachverfolgung aller Änderungen
- **Kollaboration:** Team-basierte Dokumentationserstellung
- **Export-Funktionen:** PDF, Word und andere Formate

## Tech Stack

### Frontend
- **React 18** mit TypeScript
- **Tailwind CSS** für modernes Styling
- **Vite** als Build-Tool
- **Axios** für API-Kommunikation

### Backend
- **Node.js 18** mit Express.js
- **Prisma ORM** für typisierte Datenbankzugriffe
- **PostgreSQL** (Produktion) / SQLite (Entwicklung)
- **Zod** für Validierung

### Infrastructure
- **Azure Static Web Apps** (Frontend)
- **Azure App Service** (Backend)
- **Azure Database for PostgreSQL**
- **Azure Key Vault** für Secrets
- **Application Insights** für Monitoring

## Schnellstart

### Voraussetzungen

- Node.js 18+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- Azure CLI ([Installation](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/dch1985/it-doku.git
cd it-doku

# Dependencies installieren
npm install

# Backend starten (Terminal 1)
cd backend
npm install
npm run dev

# Frontend starten (Terminal 2)
cd frontend
npm install
npm run dev
```

Die Anwendung ist dann verfügbar unter:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health

### Erste Schritte

1. Öffne http://localhost:5173 in deinem Browser
2. Erstelle dein erstes Dokument über das Formular
3. Durchsuche die Dokumentenliste
4. Teste die API-Endpunkte unter http://localhost:3001

## Projektstruktur

```
it-doku/
├── .github/workflows/      # CI/CD Pipelines
├── backend/               # Node.js API Server
│   ├── src/              # Quellcode
│   ├── prisma/           # Datenbankschema & Migrationen
│   └── __tests__/        # Backend Tests
├── frontend/             # React Single Page Application
│   ├── src/             # Quellcode
│   └── __tests__/       # Frontend Tests
├── infrastructure/       # Terraform/Azure Deployment
├── docs/                # Projektdokumentation
├── scripts/             # Utility Scripts
└── README.md           # Diese Datei
```

## Deployment

### Automatisches Deployment

Push-basiertes Deployment über GitHub Actions:

- **Development:** Push nach `develop` Branch
- **Production:** Push nach `main` Branch

### Manuelles Deployment

```bash
# Azure-Ressourcen erstellen
./scripts/setup.sh [dev|test|staging|prod]

# Oder mit Terraform
cd infrastructure
terraform init
terraform apply -var="environment=dev"

# Datenbank migrieren
./scripts/migrate.sh dev

# Health Check
./scripts/health-check.sh dev
```

## Testing

```bash
# Alle Tests ausführen
npm test

# Backend Tests
cd backend && npm test

# Frontend Tests
cd frontend && npm test

# E2E Tests
npm run test:e2e

# Test Coverage
npm run test:coverage
```

### Test-Berichte

- **Unit Tests:** 80%+ Code Coverage
- **Integration Tests:** API-Endpunkte
- **E2E Tests:** Kritische User Journeys

## API-Dokumentation

### Basis-Endpunkte

```http
GET /health                 # System Health Check
GET /api/documents         # Alle Dokumente abrufen
POST /api/documents        # Neues Dokument erstellen
GET /api/documents/:id     # Einzelnes Dokument abrufen
PUT /api/documents/:id     # Dokument aktualisieren
DELETE /api/documents/:id  # Dokument löschen
```

### Beispiel-Request

```javascript
// Neues Dokument erstellen
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Server-Konfiguration Webserver-01',
    content: 'Ubuntu 22.04 LTS, Nginx 1.18, SSL-Zertifikat: Let\'s Encrypt',
    category: 'server'
  })
});
```

## Konfiguration

### Umgebungsvariablen

#### Backend (.env)
```env
# Database
DATABASE_URL="file:./dev.db"                    # SQLite (dev)
DATABASE_URL="postgresql://user:pass@host/db"   # PostgreSQL (prod)

# Authentication
JWT_SECRET="your-secret-key"
AZURE_CLIENT_ID="your-azure-client-id"
AZURE_TENANT_ID="your-azure-tenant-id"

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
```

#### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:3001"      # Lokale Entwicklung
VITE_API_BASE_URL="/api"                       # Produktion
VITE_AZURE_CLIENT_ID="your-azure-client-id"
```

## Development Guidelines

### Code Style

- **ESLint** + **Prettier** für einheitliche Formatierung
- **TypeScript** für Type Safety
- **Conventional Commits** für Git-Nachrichten

### Git Workflow

```bash
# Feature Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git add .
git commit -m "feat: neue Funktion hinzugefügt"

# Pull Request erstellen
git push origin feature/neue-funktion
```

### Commit-Konventionen

- `feat:` Neue Features
- `fix:` Bugfixes
- `docs:` Dokumentationsänderungen
- `style:` Code-Formatierung
- `refactor:` Code-Refactoring
- `test:` Tests hinzufügen/ändern

## Roadmap

### Version 1.0 (MVP) ✅
- [x] CRUD-Operationen für Dokumente
- [x] Responsive Web-Interface
- [x] Basic Search-Funktionalität
- [x] Azure-Deployment
- [x] CI/CD Pipeline

### Version 1.1 (Q2 2024)
- [ ] Azure AD Single Sign-On
- [ ] Erweiterte Suchfilter
- [ ] Document Templates
- [ ] Bulk-Operationen

### Version 1.2 (Q3 2024)
- [ ] Kollaborative Bearbeitung
- [ ] Kommentar-System
- [ ] Benachrichtigungen
- [ ] Advanced Analytics

### Version 2.0 (Q4 2024)
- [ ] KI-gestützte Dokumentationsvorschläge
- [ ] Auto-Discovery von IT-Assets
- [ ] Mobile App (PWA)
- [ ] Integration mit ITSM-Tools

## Monitoring & Support

### Live-System URLs

- **Production Frontend:** (wird nach Azure-Deployment ergänzt)
- **Production API:** (wird nach Azure-Deployment ergänzt)
- **Staging Environment:** (wird nach Azure-Deployment ergänzt)

### Monitoring

- **Application Insights:** (wird nach Azure-Deployment eingerichtet)
- **Health Checks:** Automatische Überwachung alle 5 Minuten
- **Alerts:** E-Mail-Benachrichtigungen bei Ausfällen

### Support

Bei Problemen oder Fragen:

1. **Issues:** [GitHub Issues](https://github.com/dch1985/it-doku/issues)
2. **Dokumentation:** [docs/](./docs/) Verzeichnis
3. **E-Mail:** dchaouat@chaouat-consulting.de

## Sicherheit

### Sicherheitsrichtlinien

- Alle API-Endpunkte sind durch JWT oder Azure AD geschützt
- Input-Validierung mit Zod-Schemas
- SQL-Injection-Schutz durch Prisma ORM
- HTTPS-Enforcing in Produktion
- Secret-Management über Azure Key Vault

### Schwachstellen melden

Sicherheitslücken bitte per E-Mail an: security@chaouat-consulting.de melden.
Nutze **nicht** die öffentlichen GitHub Issues für Sicherheitsprobleme.

## Performance

### Benchmarks

- **Page Load Time:** < 2 Sekunden
- **API Response Time:** < 500ms
- **Database Queries:** < 100ms
- **Bundle Size:** < 200KB (gzip)

### Optimierungen

- Code Splitting für kleinere Bundle-Größen
- Lazy Loading für bessere Performance
- Database Query Optimization
- CDN für statische Assets

## Contributing

Da dies ein Einzelprojekt ist, sind externe Beiträge aktuell nicht vorgesehen. Das Projekt dient als persönliche Lernerfahrung und Portfolio-Showcase.

### Interne Entwicklung

1. Branch von `develop` erstellen
2. Feature implementieren + Tests schreiben
3. Pull Request nach `develop`
4. Code Review (Selbstreview)
5. Merge nach `develop`
6. Release nach `main`

## Lizenz

Dieses Projekt ist unter der [MIT Lizenz](LICENSE) veröffentlicht.

## Changelog

### v1.0.0 (2024-03-15)
- Initiale Veröffentlichung
- CRUD-Funktionalität für Dokumente
- Responsive Web-Interface
- Azure-Deployment

### v0.9.0 (2024-03-01)
- MVP-Features implementiert
- CI/CD Pipeline eingerichtet
- Basis-Tests implementiert

## Credits

### Technologien

- [React](https://reactjs.org/) - Frontend Framework
- [Node.js](https://nodejs.org/) - Backend Runtime
- [Prisma](https://www.prisma.io/) - Database ORM
- [Azure](https://azure.microsoft.com/) - Cloud Platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework

### Inspiration

Dieses Projekt wurde entwickelt, um die Dokumentationsqualität in IT-Teams zu verbessern und moderne Entwicklungspraktiken zu demonstrieren.

---

**Entwickelt von:** Driss Chaouat  
**Unternehmen:** Chaouat-Consulting  
**Kontakt:** dchaouat@chaouat-consulting.de  

⭐ Vergiss nicht, diesem Projekt einen Stern zu geben, wenn es dir gefällt!