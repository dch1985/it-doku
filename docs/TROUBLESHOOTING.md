# Troubleshooting Guide

## Problem: "Failed to load documents"

### Ursache: Azure SQL Server Firewall blockiert Verbindung

**Fehlermeldung:**
```
Cannot open server 'itdokusql1969' requested by the login. 
Client with IP address '87.169.155.196' is not allowed to access the server.
```

### Lösungen:

#### Option 1: Azure Portal - Firewall-Regel hinzufügen (Empfohlen)

1. Gehe zu [Azure Portal](https://portal.azure.com)
2. Navigiere zu deiner SQL Server Instanz (`itdokusql1969`)
3. Gehe zu **Settings** → **Networking** oder **Firewalls and virtual networks**
4. Klicke auf **Add client IPv4 address** oder **+ Add a firewall rule**
5. Füge deine aktuelle IP-Adresse hinzu: `87.169.155.196`
6. ODER aktiviere **Allow Azure services and resources to access this server** (wenn du von Azure aus zugreifst)
7. Speichere die Änderungen (kann bis zu 5 Minuten dauern)

**Alternative via Azure CLI:**
```bash
az sql server firewall-rule create \
  --resource-group <your-resource-group> \
  --server itdokusql1969 \
  --name MyIP \
  --start-ip-address 87.169.155.196 \
  --end-ip-address 87.169.155.196
```

#### Option 2: Temporäre lokale Datenbank für Entwicklung

Falls du für die Entwicklung eine lokale Datenbank verwenden möchtest:

1. Ändere `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"  // Statt "sqlserver"
  url      = "file:./dev.db"
}
```

2. Führe Migrationen aus:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

3. Erstelle einen Demo-User:
```bash
npx prisma studio
# Oder via SQL:
npx prisma db execute --stdin <<< "INSERT INTO users (id, email, name, role) VALUES ('demo-user-id', 'demo@local.dev', 'Demo User', 'ADMIN');"
```

#### Option 3: IP-Adresse dynamisch hinzufügen (PowerShell Script)

Erstelle ein Script, das deine aktuelle IP-Adresse automatisch hinzufügt:

```powershell
# Get current IP
$currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content

# Add to Azure SQL Firewall via Azure CLI
az sql server firewall-rule create \
  --resource-group <your-resource-group> \
  --server itdokusql1969 \
  --name "DevIP-$(Get-Date -Format 'yyyyMMdd')" \
  --start-ip-address $currentIP \
  --end-ip-address $currentIP
```

### Prüfung ob Problem behoben ist:

```bash
# Test Backend API
curl http://localhost:3001/api/health

# Test Documents Endpoint
curl http://localhost:3001/api/documents
```

### Temporäre Workaround (wenn Firewall nicht geändert werden kann)

Falls du die Firewall-Regel nicht sofort ändern kannst, implementiere eine Fallback-Lösung:

```typescript
// backend/src/routes/documents.ts
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    res.json(documents)
  } catch (error: any) {
    // Fallback: Return empty array if database is unavailable
    if (error.code === 'P1001' || error.message.includes('firewall')) {
      console.warn('[Documents] Database firewall issue - returning empty array')
      return res.json([])
    }
    throw error
  }
})
```

## Weitere häufige Probleme

### Backend läuft nicht
- Prüfe ob Port 3001 frei ist: `netstat -ano | findstr :3001`
- Starte Backend: `cd backend && npm run dev`

### Frontend kann Backend nicht erreichen
- Prüfe CORS-Einstellungen im Backend
- Prüfe ob `VITE_API_URL` in `frontend/.env` korrekt gesetzt ist
- Prüfe Browser-Konsole für CORS-Fehler

### Datenbank-Fehler
- Prüfe `DATABASE_URL` in `backend/.env`
- Führe Prisma Migrationen aus: `npx prisma migrate dev`
- Generiere Prisma Client: `npx prisma generate`

---

## Problem: Automationsjobs bleiben auf `PENDING`

### Ursache
Queue-/Run-Flags sind nicht passend gesetzt. Typischer Fall:
- `AUTOMATION_RUN_IMMEDIATE=false`
- `AUTOMATION_QUEUE_AUTORUN=false`

Dann wird ein Job erstellt, aber nicht automatisch verarbeitet.

### Lösung
Wähle genau einen gültigen Verarbeitungsmodus:

1. **Sofortmodus (Dev):**
   - `AUTOMATION_RUN_IMMEDIATE=true`
   - `AUTOMATION_QUEUE_AUTORUN=false`
2. **Queue-Modus:**
   - `AUTOMATION_RUN_IMMEDIATE=false`
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - optional Worker starten: `npm run automation:worker`
3. **Manuelle Einmalverarbeitung:**
   - `npm run automation:job -- <jobId>`

---

## Problem: "Service Bus Provider ausgewählt..." Fehler

### Ursache
`AUTOMATION_QUEUE_PROVIDER=servicebus` ist gesetzt, aber mindestens eine Pflichtvariable fehlt:
- `AZURE_SERVICE_BUS_CONNECTION_STRING`
- `AZURE_SERVICE_BUS_QUEUE_NAME`

### Lösung
1. Fehlende Variablen in `backend/.env` setzen.
2. Backend/Worker neu starten.
3. Mit einem neuen Job testen und Logs auf `[AutomationQueue] Service Bus Verbindung aufgebaut` prüfen.

---

## Problem: Connector kann nicht aktiviert/deaktiviert werden

### Typische Fehlermeldungen
- `Globale Connectoren können nicht angepasst werden`
- `Connector gehört einem anderen Tenant`

### Ursache
`PATCH /api/automation/connectors/:id` erlaubt nur tenant-eigene Connectoren. Globale Connectoren (`tenantId = null`) sind read-only.

### Lösung
1. Connector im richtigen Tenant anlegen.
2. Request mit korrektem `X-Tenant-ID` Header senden.
3. Für globale Connectoren nur Anzeige verwenden, keine Statusänderung.

---

## Problem: Knowledge Node Update liefert 403 / Zugriff verweigert

### Ursache
Der Node oder das verknüpfte Dokument gehört zu einem anderen Tenant.

### Lösung
1. Prüfen, ob `documentId` im gleichen Tenant liegt.
2. Sicherstellen, dass `X-Tenant-ID` korrekt gesetzt ist.
3. Bei "orphan" Nodes (ohne Dokument) auf konsistente Tenant-Metadaten achten.

---

## Problem: Compliance-Quality-Check liefert unerwartete Findings

### Erklärung
`POST /api/compliance/quality/check` nutzt aktuell regelbasierte Heuristiken und meldet u.a.:
- Platzhaltertexte wie "Lorem Ipsum"
- potenzielle Klartext-Passwörter (`password: ...`)
- fehlenden Review-Hinweis
- fehlenden Owner/Verantwortlichkeits-Hinweis

### Empfehlung
1. Findings fachlich prüfen und Inhalte bereinigen.
2. Finding mit `PATCH /api/compliance/quality/findings/:id` auf `RESOLVE` setzen.
3. Check erneut ausführen, um offenen Bestand zu verifizieren.

---

## Problem: Review-Status Update wird abgelehnt

### Ursache
Ungültiger Statuswert in `PATCH /api/compliance/reviews/:id`.

### Gültige Werte
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

### Lösung
1. Statuswert auf einen der erlaubten Werte normalisieren.
2. Request erneut senden (optional mit `comments`).

---

## Problem: `/api/search` liefert 400 "Validation failed"

### Ursache
Der Parameter `q` fehlt oder ist leer.

### Lösung
1. Query immer mit Suchbegriff senden, z.B.:
   - `/api/search?q=backup`
2. Optional `type=documents|knowledge` und `limit=<n>` ergänzen.

