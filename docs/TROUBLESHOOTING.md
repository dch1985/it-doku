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

### Automate: Connector kann nicht aktiviert/deaktiviert werden

**Symptom:** `PATCH /api/automation/connectors/:id` liefert `403` mit Hinweis auf globale Connectoren.

**Ursache:** Globale Connectoren (`tenantId = null`) sind absichtlich schreibgeschützt.

**Lösung:**
1. Erstelle einen tenant-spezifischen Connector via `POST /api/automation/connectors`.
2. Verwende danach `PATCH /api/automation/connectors/:id` mit `{ "isActive": true|false }`.
3. Prüfe, dass der Request den korrekten Tenant-Header enthält.

### Automate/Centralize/Comply liefern leere Listen oder 403

**Symptom:** Endpoints wie `/api/automation/jobs`, `/api/knowledge`, `/api/compliance/reviews` liefern keine Daten oder Zugriff verweigert.

**Ursache:** Tenant-Kontext fehlt oder verweist auf den falschen Tenant.

**Lösung:**
- Sende `X-Tenant-ID` (oder `X-Tenant-Slug`) in allen tenant-spezifischen Requests.
- Prüfe im Frontend, dass ein Tenant aktiv ausgewählt ist.
- Verifiziere den Header schnell per cURL:

```bash
curl -H "X-Tenant-ID: <tenantId>" http://localhost:3002/api/automation/jobs
```

### Queue-Mode mit Service Bus startet nicht

**Symptom:** Worker oder API melden Fehler beim Initialisieren der Queue.

**Häufige Ursache:** `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber eine der Pflichtvariablen fehlt.

**Checkliste:**
1. `AUTOMATION_QUEUE_PROVIDER=servicebus`
2. `AZURE_SERVICE_BUS_CONNECTION_STRING` gesetzt
3. `AZURE_SERVICE_BUS_QUEUE_NAME` gesetzt
4. Danach Worker neu starten: `cd backend && npm run automation:worker`

### Compliance: Quality Finding Update schlägt fehl

**Symptom:** `PATCH /api/compliance/quality/findings/:id` gibt `400` (`Keine Änderungen angegeben`).

**Ursache:** Der Request enthält weder `action` noch eine `resolution`.

**Lösung (eine der Varianten):**
- Finding lösen: `{ "action": "RESOLVE", "resolution": "..." }`
- Finding wieder öffnen: `{ "action": "REOPEN" }`
- Nur Resolution setzen/ändern: `{ "resolution": "..." }`

### Compliance: Review-Status wird abgelehnt

**Symptom:** `PATCH /api/compliance/reviews/:id` liefert `400` mit `Ungültiger Review-Status`.

**Erlaubte Statuswerte:**
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

**Tipp:** Status immer in Großbuchstaben senden.

