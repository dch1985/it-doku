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

## Automate / Centralize / Comply: Häufige Probleme

### Problem: `Tenant context required` oder leere Ergebnisse trotz vorhandener Daten
**Symptom:**
- `GET /api/analytics` liefert `400 Tenant context required` (insbesondere außerhalb von Dev-Auth)
- Automate/Centralize/Comply zeigen keine Daten

**Ursache:**
- Tenant-Kontext fehlt (`X-Tenant-ID`) oder falscher Tenant ist ausgewählt.

**Lösung:**
1. Im Frontend einen Tenant im Selector aktiv wählen.
2. Bei API-Calls den Header setzen:
   ```bash
   -H "X-Tenant-ID: <tenant-id>"
   ```
3. Prüfe, ob Dokumente/Knoten wirklich in diesem Tenant liegen.

### Problem: `Service Bus Provider ausgewählt ... fehlt`
**Symptom (Backend Log):**
`Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

**Ursache:**
- `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber Service-Bus Variablen fehlen.

**Lösung:**
1. Entweder Service Bus vollständig konfigurieren:
   - `AZURE_SERVICE_BUS_CONNECTION_STRING`
   - `AZURE_SERVICE_BUS_QUEUE_NAME`
2. Oder lokal auf In-Memory zurückstellen:
   ```env
   AUTOMATION_QUEUE_PROVIDER=memory
   ```

### Problem: Job kann nicht abgebrochen oder neu gestartet werden
**Symptom:**
- Retry fehlgeschlagen bei laufendem Job
- Cancel fehlgeschlagen bei bereits abgeschlossenem Job

**Ursache (Business Rules):**
- Retry ist für `RUNNING` Jobs gesperrt.
- Cancel ist nur für `PENDING` und `RUNNING` erlaubt.

**Lösung:**
- Jobstatus in `/api/automation/jobs` prüfen und erst dann Aktion ausführen.
- Für abgeschlossene Jobs stattdessen neuen Job starten.

### Problem: Connector lässt sich nicht deaktivieren
**Symptom:**
- `PATCH /api/automation/connectors/:id` gibt `403` zurück

**Ursache:**
- Globaler Connector (`tenantId = null`) kann nicht auf Tenant-Ebene geändert werden.

**Lösung:**
- Tenant-spezifischen Connector erstellen und diesen aktiv/deaktivieren.

### Problem: Compliance Update liefert `Keine Änderungen angegeben` oder `Ungültiger ...`
**Symptom:**
- `PATCH /api/compliance/quality/findings/:id` oder `PATCH /api/compliance/reviews/:id` schlägt fehl

**Ursache:**
- Pflichtfelder fehlen oder Status/Aktion ist ungültig.

**Lösung:**
- Findings nur mit `action=RESOLVE|REOPEN` (optional `resolution`) oder geänderter `resolution` senden.
- Review-Status nur aus dieser Menge verwenden:
  - `PENDING`
  - `APPROVED`
  - `CHANGES_REQUESTED`
  - `REJECTED`

### Problem: Globale Suche reagiert nicht bei kurzen Suchbegriffen
**Symptom:**
- Command Palette zeigt keine API-Suchergebnisse bei 1–2 Zeichen.

**Ursache:**
- Frontend triggert Global Search erst ab mehr als 2 Zeichen.

**Lösung:**
- Mindestens 3 Zeichen eingeben oder direkt `/api/search?q=<term>` aufrufen.

