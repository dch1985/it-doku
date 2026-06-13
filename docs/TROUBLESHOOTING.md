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
- Prüfe den konfigurierten Port (`PORT` in `backend/.env`, Standard in `env.sample`: `3002`).
- Linux/macOS Portcheck: `ss -ltnp | rg 3002`
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

## Automate / Centralize / Comply - typische Stolperfallen

### Problem: Automationsjobs bleiben auf `PENDING`

**Symptom:**
- `GET /api/automation/jobs` zeigt dauerhaft `PENDING`.

**Häufige Ursache:**
- `AUTOMATION_RUN_IMMEDIATE=false` **und** `AUTOMATION_QUEUE_AUTORUN=false`.
- Oder: `AUTOMATION_QUEUE_PROVIDER=memory` bei getrennten API-/Worker-Prozessen (prozesslokale Queue).

**Lösung:**
1. Für lokale Direktverarbeitung: `AUTOMATION_RUN_IMMEDIATE=true`.
2. Für Queue-basierten Betrieb über Prozessgrenzen: `AUTOMATION_QUEUE_PROVIDER=servicebus` + Azure Service Bus Variablen setzen.
3. Einzeljob manuell verarbeiten:
   ```bash
   cd backend
   npm run automation:job -- <jobId>
   ```

### Problem: `PATCH /api/automation/connectors/:id` liefert 403

**Symptom:**
- Fehlermeldung wie `Globale Connectoren können nicht angepasst werden`.

**Ursache:**
- Globaler Connector (`tenantId == null`) wird tenantseitig geändert.

**Lösung:**
- Nur tenant-lokale Connectoren toggeln.
- Im UI sind globale Connectoren bewusst als read-only markiert.

### Problem: Search liefert `Validation failed`

**Symptom:**
- `Query parameter "q" is required` oder `Query cannot be empty`.

**Ursache:**
- `GET /api/search` wurde ohne `q` oder mit leerem Query aufgerufen.

**Lösung (Beispiel):**
```bash
curl -H "X-Tenant-ID: <tenant-id>" \
  "http://localhost:3002/api/search?q=backup&type=knowledge&limit=10"
```

### Problem: Knowledge Node kann nicht aktualisiert/gelöscht werden (`403`)

**Symptom:**
- `Zugriff verweigert` oder `Zugriff auf das Dokument ist nicht erlaubt`.

**Ursache:**
- Node oder zugeordnetes Dokument gehört zu einem anderen Tenant.

**Lösung:**
- Korrektes `X-Tenant-ID` senden.
- Bei `documentId` prüfen, ob das Ziel-Dokument im gleichen Tenant liegt.

### Problem: Quality Check / Findings-Update schlägt fehl

**Symptom:**
- `documentId ist erforderlich` bei `/api/compliance/quality/check`
- oder `Keine Änderungen angegeben` bei `PATCH /api/compliance/quality/findings/:id`

**Ursache:**
- Pflichtfelder fehlen.
- Finding-Update ohne `action` (`RESOLVE`/`REOPEN`) oder ohne geänderte `resolution`.

**Lösung:**
```bash
# Quality Check
curl -X POST http://localhost:3002/api/compliance/quality/check \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{"documentId":"<doc-id>"}'

# Finding schließen
curl -X PATCH http://localhost:3002/api/compliance/quality/findings/<finding-id> \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{"action":"RESOLVE","resolution":"Owner ergänzt"}'
```

### Problem: Review-Status wird abgelehnt

**Symptom:**
- `Ungültiger Review-Status: ...` bei `PATCH /api/compliance/reviews/:id`.

**Erlaubte Statuswerte:**
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

**Lösung:**
- Nur diese vier Statuswerte senden und optional `comments` ergänzen.

