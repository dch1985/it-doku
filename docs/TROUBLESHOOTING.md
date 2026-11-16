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

## Automate / Comply / Centralize: Häufige Probleme

### Problem: Automations-Jobs bleiben dauerhaft auf `PENDING`

**Typische Ursache:** Kein aktiver Verarbeitungsmodus.

Prüfe in `backend/.env`:

```env
AUTOMATION_RUN_IMMEDIATE=true
AUTOMATION_QUEUE_AUTORUN=false
AUTOMATION_QUEUE_PROVIDER=memory
```

Alternativ Queue-basiert:

- `AUTOMATION_QUEUE_AUTORUN=true` für In-Process-Verarbeitung, oder
- Worker starten: `cd backend && npm run automation:worker`

Wenn die Konfiguration korrigiert ist, Job neu anstoßen:

```bash
curl -X POST <backend-base-url>/api/automation/jobs/<jobId>/retry \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

### Problem: `403` beim Connector-Toggle

**Typische Ursache:** Der Connector ist global (`tenantId = null`) oder gehört zu einem anderen Tenant.

- Endpoint: `PATCH /api/automation/connectors/:id`
- Nur tenant-eigene Connectoren lassen sich per API aktivieren/deaktivieren.

### Problem: Compliance-Quality-Check liefert „unerwartet neue“ Findings

`POST /api/compliance/quality/check` ersetzt bestehende manuelle Findings (`generationJobId = null`) für das Dokument.  
Das Verhalten ist im Service absichtlich so implementiert.

### Problem: Knowledge Nodes sind nicht sichtbar

Für Nodes ohne `documentId` wird die Tenant-Zuordnung über `metadata.tenantId` aufgelöst.

- Falsches Tenant-Header-Setup (`X-Tenant-ID` / `X-Tenant-Slug`) blendet Nodes aus.
- Bei Update/Delete kann stattdessen ein `403 Zugriff verweigert` zurückkommen.

### Problem: Review-Status-Update schlägt mit `400` fehl

Erlaubte Statuswerte für `PATCH /api/compliance/reviews/:id`:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

---

Für detaillierte Workflows, API-Referenz und Betriebsmodi:
`docs/AUTOMATION_COMPLIANCE_KNOWLEDGE_RUNBOOK.md`

