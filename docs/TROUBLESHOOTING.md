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
- Prüfe ob Port 3002 frei ist (Linux): `ss -ltnp | rg ":3002"`
- Prüfe ob Port 3002 frei ist (Windows): `netstat -ano | findstr :3002`
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

## Automate / Centralize / Comply: Häufige Fehlerbilder

### Problem: Automationsjobs bleiben auf `PENDING`

**Typische Ursache:**
- `AUTOMATION_QUEUE_AUTORUN=false` **und** `AUTOMATION_RUN_IMMEDIATE=false`
- oder Queue-Modus aktiv, aber kein Worker/Subscriber läuft

**Lösung:**
1. Für direkte Verarbeitung:
   - `AUTOMATION_RUN_IMMEDIATE=true`
   - `AUTOMATION_QUEUE_AUTORUN=false`
2. Für Queue-Betrieb:
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - `npm run automation:worker` starten (oder eigenen Consumer betreiben)
3. Einzeljob manuell ausführen:
   - `npm run automation:job -- <jobId>`

### Problem: Fehler `Service Bus Provider ausgewählt ... fehlt`

**Typische Ursache:**
- `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber fehlende Azure-Variablen.

**Lösung:**
- `AZURE_SERVICE_BUS_CONNECTION_STRING` setzen
- `AZURE_SERVICE_BUS_QUEUE_NAME` setzen
- Backend/Worker neu starten

### Problem: `Globale Connectoren können nicht angepasst werden`

**Typische Ursache:**
- PATCH auf einen Connector mit `tenantId=null` (globaler System-Connector).

**Lösung:**
- Nur tenant-eigene Connectoren über `/api/automation/connectors/:id` umschalten.
- Globale Connectoren über System-Administration pflegen.

### Problem: `Tenant identifier required`

**Typische Ursache:**
- Tenant-Header fehlt bei tenant-geschützten Endpunkten.

**Lösung:**
- `X-Tenant-ID` oder `X-Tenant-Slug` mitsenden.
- In Dev-Mode (`DEV_AUTH_ENABLED=true`) ist tenantloser Zugriff für Tests möglich.

### Problem: `Zugriff verweigert` bei Knowledge Nodes

**Typische Ursache:**
- Node ist einem anderen Tenant zugeordnet (Dokumentbezug oder tenantId in Metadata).

**Lösung:**
- Tenant-Kontext prüfen.
- Bei dokumentlosen Nodes Metadata-Tenant prüfen.
- Node nur innerhalb des korrekten Tenant-Kontexts bearbeiten/löschen.

### Problem: Knowledge Node erscheint nicht in globaler Suche

**Typische Ursache:**
- `/api/search?type=knowledge` berücksichtigt im Tenant-Kontext primär Nodes mit dokumentbezogenem Tenant.

**Lösung:**
- Node einem Dokument im gleichen Tenant zuordnen.
- Danach erneut `/api/search?q=<term>&type=knowledge` ausführen.

### Problem: Review Request kann nicht erstellt/aktualisiert werden

**Typische Ursache:**
- `reviewerId` existiert nicht
- oder ungültiger Review-Status beim PATCH

**Lösung:**
- Prüfen, ob der Reviewer als User im System vorhanden ist und zum Tenant-Kontext passt.
- Erlaubte Status: `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`.

### Problem: Quality Findings lassen sich nicht schließen

**Typische Ursache:**
- PATCH ohne `action` oder ohne echte Änderung.

**Lösung:**
- Zum Schließen: `action=RESOLVE` (optional `resolution`)
- Zum Wiederöffnen: `action=REOPEN`
- Bei reinem Kommentarupdate `resolution` explizit setzen.

