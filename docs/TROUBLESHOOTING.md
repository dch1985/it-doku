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

### Backend läuft nicht

- Prüfe ob Port 3002 frei ist: `lsof -i :3002`
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

## Automate / Centralize / Comply - typische Betriebsprobleme

### Problem: Automationsjob bleibt auf `PENDING`

**Symptome**

- `GET /api/automation/jobs` zeigt den Job dauerhaft als `PENDING`
- Kein `completedAt`, kein `error`

**Häufige Ursache**

- `AUTOMATION_RUN_IMMEDIATE=false` und `AUTOMATION_QUEUE_AUTORUN=false`, aber kein Worker aktiv

**Lösung**

1. Prüfe Flags in `backend/.env`:
   - Für Sync-Verarbeitung lokal: `AUTOMATION_RUN_IMMEDIATE=true`
   - Für Queue-Verarbeitung: Worker starten
2. Starte Worker:
   ```bash
   cd backend
   npm run automation:worker
   ```
3. Bei Service Bus zusätzlich prüfen:
   - `AUTOMATION_QUEUE_PROVIDER=servicebus`
   - `AZURE_SERVICE_BUS_CONNECTION_STRING` gesetzt
   - `AZURE_SERVICE_BUS_QUEUE_NAME` gesetzt

### Problem: `Tenant identifier required` / `Tenant membership required`

**Symptome**

- 400: `Tenant identifier required. Please provide X-Tenant-ID or X-Tenant-Slug header.`
- 403 bei Automate/Centralize/Comply-Endpunkten

**Ursache**

- Tenant-Header fehlt oder User ist kein Mitglied des Tenants

**Lösung**

```bash
curl -s https://<backend-host>/api/automation/jobs \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

Wenn die Anfrage damit funktioniert, liegt das Problem im fehlenden Header oder im Frontend-Tenant-Kontext.

### Problem: Connector kann nicht aktiviert/deaktiviert werden

**Symptome**

- Fehler bei `PATCH /api/automation/connectors/:id`
- Meldungen wie `Globale Connectoren können nicht angepasst werden`

**Ursache**

- Der Connector ist global (`tenantId=null`) oder gehört einem anderen Tenant

**Lösung**

- Nur tenant-eigene Connectoren im jeweiligen Tenant bearbeiten
- Globale Connectoren über systemweite Administration verwalten

### Problem: Compliance Quality Check liefert unerwartete Findings

**Symptome**

- INFO/WARNING Findings trotz "fertiger" Doku

**So arbeitet der Check aktuell**

- Erkennt Platzhalter (`lorem ipsum`, `dummy text`)
- Erkennt Klartext-Passwörter (`password: ...`)
- Meldet Hinweis, wenn kein Review-Abschnitt vorkommt
- Meldet Hinweis, wenn kein Owner/Verantwortlicher genannt wird

**Lösung**

- Doku auf diese Pattern prüfen und Abschnitte zu Review + Verantwortlichkeit ergänzen
- Check erneut ausführen:
  ```bash
  curl -s -X POST https://<backend-host>/api/compliance/quality/check \
    -H "Authorization: Bearer <token>" \
    -H "X-Tenant-ID: <tenant-id>" \
    -H "Content-Type: application/json" \
    -d '{"documentId":"<document-id>"}'
  ```

### Problem: Knowledge Nodes erscheinen nicht in `/api/search?type=knowledge`

**Symptome**

- Node ist in `/api/knowledge` sichtbar, aber nicht in globaler Suche

**Ursache**

- Tenant-gefilterte Suche priorisiert Nodes mit verknüpftem Dokument (`documentId`)
- Orphan Nodes (ohne Dokument) sind in Search nicht immer enthalten

**Lösung**

- Für vollständige Inventur immer `/api/knowledge` nutzen
- Wichtige Nodes einem Dokument zuordnen, wenn sie über Search auffindbar sein sollen
