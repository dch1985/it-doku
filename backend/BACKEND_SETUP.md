# Backend Setup & Troubleshooting

## Backend-Frontend Kompatibilität

Das Backend wurde angepasst, um mit dem modernen Frontend kompatibel zu sein.

### Durchgeführte Änderungen

#### 1. TypeScript Konfiguration (`tsconfig.json`)
- Neu erstellt für korrekte TypeScript-Kompilierung
- Module-Resolution: node
- Target: ES2020
- CommonJS Module

#### 2. Prisma Schema (`prisma/schema.prisma`)
**Angepasst für Frontend-Kompatibilität:**

- `category`: `enum` → `String`
  *Grund: Frontend erwartet flexible String-Werte*

- `author`: Neues Feld hinzugefügt
  *Standard: "System"*

- `DocumentStatus`: Werte auf lowercase geändert
  *Vorher: `DRAFT`, `PUBLISHED`, `ARCHIVED`*
  *Jetzt: `draft`, `published`, `archived`*

#### 3. Document Service (`src/services/document.service.ts`)
**Komplett überarbeitet** mit neuer `formatDocument()` Funktion:

```typescript
function formatDocument(doc: any) {
  return {
    id: doc.id.toString(),      // Int → String Konvertierung
    tags: JSON.parse(doc.tags),  // JSON String → Array
    status: doc.status.toLowerCase(),
    // ...weitere Felder
  };
}
```

**Warum?** Das Frontend erwartet:
- `id` als String
- `tags` als Array
- `status` in lowercase

#### 4. Backend Index (`src/index.ts`)
- `dotenv` Imports entfernt (nicht benötigt)
- CORS angepasst: `localhost:5173` hinzugefügt (Vite Port)

---

## ⚠️ Prisma Client Problem

### Problem
Der Prisma Client konnte nicht generiert werden aufgrund von Netzwerkbeschränkungen:

```
Error: Failed to fetch the engine file at
https://binaries.prisma.sh/.../schema-engine.gz - 403 Forbidden
```

### Lösung (manuell durchführen)

#### Option 1: Standard-Weg (wenn Netzwerk funktioniert)
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Option 2: Mit Checksumme ignorieren
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push
```

#### Option 3: Proxy/VPN verwenden
Falls Firewall/Proxy das Problem ist, temporär VPN nutzen oder Proxy-Einstellungen anpassen.

#### Option 4: Manuelle Datenbank-Initialisierung
Siehe `prisma/init-db.sql` für manuelles SQL-Schema.

---

## Backend Starten

### Voraussetzungen
1. ✅ Node.js (v18+)
2. ✅ npm Dependencies installiert
3. ⚠️ Prisma Client generiert (siehe oben)

### Start-Befehle
```bash
cd backend

# Development Mode
npm run dev

# Production Build
npm run build
npm start

# Database Studio
npm run db:studio
```

---

## API Endpoints

### Health Check
```
GET /health
```

### Documents
```
GET    /api/documents      - Alle Dokumente
GET    /api/documents/:id  - Ein Dokument
POST   /api/documents      - Neues Dokument
PUT    /api/documents/:id  - Dokument aktualisieren
DELETE /api/documents/:id  - Dokument löschen
```

---

## Testing

### Backend testen
```bash
# API mit curl testen
curl http://localhost:3001/health

# Erwartete Antwort:
{
  "status": "ok",
  "timestamp": "2025-10-24T..."
}
```

### Frontend-Backend Verbindung testen
1. Backend starten: `npm run dev` (Port 3001)
2. Frontend starten: `npm run dev` (Port 5173)
3. Im Browser: `http://localhost:5173`
4. Dashboard öffnen - sollte Daten vom Backend laden

---

## Nächste Schritte

- [ ] Prisma Client generieren (wenn Netzwerk verfügbar)
- [ ] Datenbank-Migrationen durchführen
- [ ] Backend-Tests schreiben
- [ ] API-Dokumentation erweitern
- [ ] Error Handling verbessern
- [ ] Logging-System implementieren

---

## Fehlerbehebung

### "Cannot find module 'dotenv'"
✅ **Gelöst** - dotenv Imports wurden entfernt

### "@prisma/client did not initialize yet"
⚠️ **Aktiv** - Prisma generate muss durchgeführt werden (siehe oben)

### CORS Errors
✅ **Gelöst** - localhost:5173 wurde zu CORS origins hinzugefügt

### TypeScript Compilation Errors
✅ **Gelöst** - tsconfig.json wurde erstellt

---

## Kontakt & Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Logs in `backend/logs/` prüfen (falls vorhanden)
- `npm run dev` Output analysieren
