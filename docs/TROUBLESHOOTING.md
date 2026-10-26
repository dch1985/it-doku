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
curl http://localhost:<PORT>/api/health

# Test Documents Endpoint
curl http://localhost:<PORT>/api/documents
```

### Temporäre Workaround (wenn Firewall nicht geändert werden kann)

Falls du die Firewall-Regel nicht sofort ändern kannst, implementiere eine Fallback-Lösung:

```typescript
// backend/src/routes/documents.ts
router.get("/", async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(documents);
  } catch (error: any) {
    // Fallback: Return empty array if database is unavailable
    if (error.code === "P1001" || error.message.includes("firewall")) {
      console.warn(
        "[Documents] Database firewall issue - returning empty array",
      );
      return res.json([]);
    }
    throw error;
  }
});
```

## Weitere häufige Probleme

### Automationsjob bleibt auf `PENDING`

**Symptom**

- `POST /api/automation/jobs` funktioniert, aber `GET /api/automation/jobs` zeigt dauerhaft `PENDING`.

**Häufige Ursachen**

1. `AUTOMATION_QUEUE_AUTORUN=false` **und** `AUTOMATION_RUN_IMMEDIATE=false` (es gibt keinen aktiven Verarbeiter).
2. `AUTOMATION_QUEUE_PROVIDER=memory` mit separatem Worker-Prozess.
3. `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber Service-Bus Variablen fehlen oder sind ungültig.

**Prüfung & Lösung**

```bash
cd backend

# Aktive Modi prüfen
echo "$AUTOMATION_QUEUE_AUTORUN"
echo "$AUTOMATION_RUN_IMMEDIATE"
echo "$AUTOMATION_QUEUE_PROVIDER"

# Einzelnen Job direkt verarbeiten (um Queue-Probleme einzugrenzen)
npm run automation:job -- <jobId>
```

- Für einfache Setups lokal: `AUTOMATION_RUN_IMMEDIATE=true` setzen.
- Für Queue-basierten Betrieb mit separatem Worker: `AUTOMATION_QUEUE_PROVIDER=servicebus` verwenden.
- Mit `memory` funktioniert Queue-Verarbeitung nur innerhalb desselben Backend-Prozesses.

### `Connector gehört einem anderen Tenant` oder `Globale Connectoren können nicht angepasst werden`

**Symptom**

- `PATCH /api/automation/connectors/:id` liefert `403`.

**Ursache**

- Der Connector ist global (`tenantId=null`) oder gehört einem anderen Tenant.

**Lösung**

- Nur tenant-eigene Connectoren in der jeweiligen Tenant-Session ändern.
- Globale Connectoren müssen systemweit administriert werden (nicht über Tenant-UI togglebar).

### Suche liefert keine Ergebnisse trotz vorhandener Daten

**Symptom**

- `/api/search` oder UI-Command-Palette zeigt `No results found`, obwohl Inhalte existieren.

**Ursache**

- Fehlender oder falscher `X-Tenant-ID` Header filtert Dokumente/Knowledge Nodes weg.

**Lösung**

- Tenant-Auswahl im Frontend prüfen.
- Bei API-Tests Header explizit setzen:

```bash
curl -H "X-Tenant-ID: <tenantId>" "http://localhost:<PORT>/api/search?q=backup"
```

### Compliance Review-Update schlägt mit Validierungsfehler fehl

**Symptom**

- `PATCH /api/compliance/reviews/:id` oder `PATCH /api/compliance/quality/findings/:id` liefert `400`.

**Ursache**

- Ungültiger Status/Aktion oder leeres Update-Payload.

**Erlaubte Werte**

- Review-Status: `PENDING`, `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`
- Finding-Aktion: `RESOLVE`, `REOPEN`

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
