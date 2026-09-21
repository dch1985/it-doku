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

- Prüfe ob Port 3002 frei ist (Linux/macOS): `lsof -i :3002`
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

## Workflow-spezifische Probleme (Automate / Centralize / Comply)

### Problem: Automationsjobs bleiben auf `PENDING`

**Typische Ursachen**

- `AUTOMATION_QUEUE_AUTORUN=false` und `AUTOMATION_RUN_IMMEDIATE=false`
- Queue-Provider `servicebus` ist aktiviert, aber Azure Service Bus Variablen fehlen
- Kein Worker läuft, wenn du manuelle Verarbeitung erwartest

**Prüfung**

```bash
cd backend
echo "$AUTOMATION_QUEUE_AUTORUN | $AUTOMATION_RUN_IMMEDIATE | $AUTOMATION_QUEUE_PROVIDER"
```

**Lösungen**

- Für lokale Entwicklung: `AUTOMATION_RUN_IMMEDIATE=true`
- Oder In-Memory Queue Auto-Run: `AUTOMATION_QUEUE_AUTORUN=true`
- Für manuelle Verarbeitung:
  ```bash
  npm run automation:job -- <jobId>
  # oder dauerhaft
  npm run automation:worker
  ```
- Bei `AUTOMATION_QUEUE_PROVIDER=servicebus` zusätzlich setzen:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`

### Problem: Connector kann nicht aktiviert/deaktiviert werden

**Symptom**

- `PATCH /api/automation/connectors/:id` liefert Fehler (`403`) trotz gültiger Session

**Ursache**

- Globaler Connector (`tenantId = null`) kann nicht tenant-seitig geändert werden.

**Lösung**

- Tenant-spezifischen Connector anlegen und diesen verwalten.
- Globale Connectoren nur über System-/Admin-Kontext anpassen.

### Problem: Knowledge Nodes erscheinen nicht in der globalen Suche

**Symptom**

- Node ist unter `/api/knowledge` sichtbar, aber nicht in `/api/search?type=knowledge`

**Ursache**

- Tenant-gefilterte Suche basiert auf `knowledgeNode.document.tenantId`.
- Orphan Nodes ohne `documentId` sind dort nicht zuverlässig auffindbar.

**Lösung**

- Node einem Tenant-Dokument zuordnen, wenn er in Suchergebnissen auftauchen soll.
- Für Orphan-Verwaltung `/api/knowledge` als primäre Quelle nutzen.

### Problem: Compliance Review Request lässt sich nicht erstellen

**Typische Ursachen**

- Kein Dokument ausgewählt
- Kein Reviewer ausgewählt
- Dokument gehört zu anderem Tenant

**Prüfung**

- Frontend: Dokument + Reviewer explizit auswählen
- API-Call: gültiges `X-Tenant-ID` Header setzen

**Lösung**

- Review mit dokumentgebundenem Tenant-Kontext anlegen.
- Sicherstellen, dass `reviewerId` auf einen existierenden User zeigt.

### Problem: `GET /api/analytics` liefert "Tenant context required"

**Ursache**

- Tenant Header fehlt außerhalb von Dev-Mode.

**Lösung**

- `X-Tenant-ID` (oder unterstützter Tenant-Slug Header) mitsenden.
- In lokaler Entwicklung prüfen, ob `DEV_AUTH_ENABLED=true` gesetzt ist.

### Problem: Quality Findings verschwinden nach erneutem Check

**Ursache**

- `POST /api/compliance/quality/check` ersetzt dokumentbezogene, manuelle Findings durch den aktuellen Prüflauf.

**Lösung**

- Erwartetes Verhalten: Findings spiegeln immer den letzten Run wider.
- Vor dem erneuten Run relevante Notizen/Resolutionen sichern, falls sie weiter benötigt werden.
