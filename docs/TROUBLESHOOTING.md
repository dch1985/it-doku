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
curl http://localhost:3002/api/health

# Test Documents Endpoint
curl http://localhost:3002/api/documents
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
- Prüfe den konfigurierten Port in `backend/.env` (Standard im Repo: `PORT=3002`)
- Linux/macOS: `lsof -i :3002`
- Windows: `netstat -ano | findstr :3002`
- Starte Backend: `cd backend && npm run dev`

### Frontend kann Backend nicht erreichen
- Prüfe CORS-Einstellungen im Backend
- Prüfe ob `VITE_API_URL` in `frontend/.env` korrekt gesetzt ist
- Prüfe Browser-Konsole für CORS-Fehler

### Datenbank-Fehler
- Prüfe `DATABASE_URL` in `backend/.env`
- Führe Prisma Migrationen aus: `npx prisma migrate dev`
- Generiere Prisma Client: `npx prisma generate`

### Fehler: `Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header.`

**Ursache:** Tenant-kontextpflichtige Endpoints wurden ohne Tenant Header aufgerufen.

**Lösung:**
1. Hole verfügbare Tenants über `GET /api/tenants`.
2. Sende anschließend `X-Tenant-ID` oder `X-Tenant-Slug` mit.

**Beispiel (curl):**
```bash
curl -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  http://localhost:3002/api/automation/jobs
```

### Fehler: `No token provided` / `Invalid or expired token`

**Ursache:** Authentifizierung aktiv, aber kein gültiges Bearer-Token gesendet.

**Lösungen:**
- **Lokal (Dev):** `DEV_AUTH_ENABLED=true` oder `NODE_ENV=development` setzen, damit Dev-Auth greift.
- **Produktiv:** Gültiges Azure-AD-Token mitsenden (`Authorization: Bearer <token>`).
- Nach Änderungen an `.env` den Backend-Prozess neu starten.

### Problem: Automationsjobs bleiben dauerhaft `PENDING`

**Typische Ursachen:**
- `AUTOMATION_QUEUE_AUTORUN=false` **und** `AUTOMATION_RUN_IMMEDIATE=false`
- Queue-Provider ist falsch konfiguriert
- Kein aktiver Consumer (Backend mit aktiviertem Autorun oder optionaler Worker)

**Lösungsschritte:**
1. Für lokale Sofortausführung:
   - `AUTOMATION_RUN_IMMEDIATE=true`
   - `AUTOMATION_QUEUE_AUTORUN=false`
2. Für Queue-Betrieb:
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - `AUTOMATION_RUN_IMMEDIATE=false`
3. Für skalierte Worker:
   - `AUTOMATION_QUEUE_PROVIDER=servicebus`
   - `AZURE_SERVICE_BUS_CONNECTION_STRING` und `AZURE_SERVICE_BUS_QUEUE_NAME` setzen
   - Optional dedizierten Worker starten: `cd backend && npm run automation:worker`
4. Einzelnen Job manuell verarbeiten:
   - `cd backend && npm run automation:job -- <jobId>`

### Fehler: `Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

**Ursache:** `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber notwendige Azure-Variablen fehlen.

**Lösung:**
- Entweder die beiden Variablen korrekt setzen,
- oder auf lokalen Provider wechseln: `AUTOMATION_QUEUE_PROVIDER=memory`.

### Problem: `/api/knowledge` oder `/api/search` liefert unerwartet leere Ergebnisse

**Ursache:** Tenant-Kontext passt nicht zu den Daten (falscher/missing `X-Tenant-ID`) oder es wird in einem anderen Tenant gesucht.

**Lösung:**
1. Tenant-ID des aktiven Users prüfen (`GET /api/tenants`).
2. Alle Requests in derselben Session mit identischem Tenant-Header senden.
3. Knowledge Nodes ohne `documentId` nur im korrekten Tenant-Kontext erwarten.

