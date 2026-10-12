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
- Prüfe ob Port 3002 frei ist: `netstat -ano | findstr :3002`
- Starte Backend: `cd backend && npm run dev`

### Frontend kann Backend nicht erreichen
- Prüfe CORS-Einstellungen im Backend
- Prüfe ob `VITE_API_URL` in `frontend/.env` korrekt gesetzt ist
- Prüfe Browser-Konsole für CORS-Fehler

### Datenbank-Fehler
- Prüfe `DATABASE_URL` in `backend/.env`
- Führe Prisma Migrationen aus: `npx prisma migrate dev`
- Generiere Prisma Client: `npx prisma generate`

## Automate/Centralize/Comply – häufige Fehlerbilder

### Problem: `Tenant identifier required` (400)

**Symptom:** Requests gegen `/api/automation`, `/api/knowledge`, `/api/compliance`, `/api/search` oder `/api/assistant` schlagen mit 400 fehl.

**Ursache:** Kein Tenant-Kontext wurde mitgegeben.

**Lösung:**
- Header `X-Tenant-ID` oder `X-Tenant-Slug` senden.
- In lokaler Entwicklung kann `DEV_AUTH_ENABLED=true` helfen, Azure-Login zu umgehen; der Tenant-Header bleibt trotzdem empfohlen.

```bash
curl -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  http://localhost:3002/api/automation/jobs
```

### Problem: Automations-Job bleibt auf `PENDING`

**Typische Ursachen:**
- `AUTOMATION_QUEUE_AUTORUN=false` und `AUTOMATION_RUN_IMMEDIATE=false`
- Worker läuft, aber Queue-Provider ist `memory` in einem anderen Prozess

**Lösung:**
1. Für lokale Inline-Ausführung: `AUTOMATION_RUN_IMMEDIATE=true`
2. Oder Queue-Betrieb aktivieren: `AUTOMATION_QUEUE_AUTORUN=true`
3. Für echte Multi-Prozess-Verarbeitung `AUTOMATION_QUEUE_PROVIDER=servicebus` + `AZURE_SERVICE_BUS_*` setzen
4. Einzelnen Job manuell starten:

```bash
cd backend
npm run automation:job -- <jobId>
```

### Problem: Connector kann nicht aktiviert/deaktiviert werden (`403`)

**Symptom:** `PATCH /api/automation/connectors/:id` liefert z. B. „Globale Connectoren können nicht angepasst werden“.

**Ursache:** Der Connector ist global (`tenantId = null`) oder gehört einem anderen Tenant.

**Lösung:**
- Nur tenant-eigene Connectoren per Tenant-UI/API ändern.
- Globale Connectoren nur über administrative Systempfade pflegen.

### Problem: Knowledge Node erscheint nicht in Search/Assistant

**Symptom:** Node ist in `/api/knowledge` sichtbar, aber nicht in `/api/search` oder Assistant-Citations.

**Ursache:** Tenant-gefilterte Suche fokussiert aktuell Nodes mit Dokumentbezug (`documentId` + passender Dokument-Tenant).

**Lösung:**
- Node mit einem Dokument des Ziel-Tenants verknüpfen.
- Danach Suche/Assistant erneut ausführen.

### Problem: Review-Status Update schlägt fehl (`400`)

**Symptom:** `PATCH /api/compliance/reviews/:id` wird abgelehnt.

**Ursache:** Ungültiger Statuswert.

**Erlaubte Status:**
- `PENDING`
- `APPROVED`
- `CHANGES_REQUESTED`
- `REJECTED`

