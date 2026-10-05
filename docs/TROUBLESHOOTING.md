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

## Automatisierung, Tenant-Isolation und Wissensmodule

### Problem: Automationsjobs bleiben dauerhaft auf `PENDING`

**Symptom:** `GET /api/automation/jobs` zeigt nur `PENDING`, kein Übergang zu `RUNNING`/`COMPLETED`.

**Ursache:** Keine aktive Ausführungsstrategie konfiguriert.

**Prüfung:**

```bash
cd backend
echo "AUTOMATION_QUEUE_AUTORUN=$AUTOMATION_QUEUE_AUTORUN"
echo "AUTOMATION_RUN_IMMEDIATE=$AUTOMATION_RUN_IMMEDIATE"
echo "AUTOMATION_QUEUE_PROVIDER=$AUTOMATION_QUEUE_PROVIDER"
```

**Lösungen:**

1. Inline-Ausführung aktivieren:
   - `AUTOMATION_QUEUE_AUTORUN=false`
   - `AUTOMATION_RUN_IMMEDIATE=true`
2. Queue-Ausführung aktivieren:
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - optional Worker starten: `npm run automation:worker`
3. Einzelnen Job manuell ausführen:
   - `npm run automation:job -- <jobId>`

> Hinweis: Wenn **beide** Flags `false` sind, bleiben Jobs absichtlich pending.

---

### Problem: Service-Bus-Queue startet nicht

**Symptom:** Fehler ähnlich _"Service Bus Provider ausgewählt, aber ... fehlt."_

**Ursache:** `AUTOMATION_QUEUE_PROVIDER=servicebus`, aber notwendige Variablen fehlen.

**Lösung:**

- Setze beide Variablen:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`
- Oder wechsle lokal auf `AUTOMATION_QUEUE_PROVIDER=memory`.

---

### Problem: `Tenant identifier required` (HTTP 400)

**Symptom:** API-Aufrufe gegen tenant-spezifische Routen schlagen fehl.

**Ursache:** Header `X-Tenant-ID` oder `X-Tenant-Slug` fehlt.

**Lösung:**

```bash
curl -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/documents
curl -H "X-Tenant-ID: <tenant-id>" http://localhost:3002/api/automation/jobs
```

Wenn du im Dev-Modus testest:

- `NODE_ENV=development` oder `DEV_AUTH_ENABLED=true` setzen,
- danach Backend neu starten.

---

### Problem: Knowledge Node kann nicht erstellt/aktualisiert werden (403/404)

**Symptom:** `POST /api/knowledge` oder `PATCH /api/knowledge/:id` gibt Zugriffsfehler zurück.

**Ursache:**

- Das referenzierte Dokument gehört einem anderen Tenant, oder
- `documentId` ist ungültig/nicht vorhanden.

**Lösung:**

1. Prüfe, ob das Dokument im selben Tenant existiert.
2. Sende den korrekten Tenant-Header mit.
3. Für tenant-unabhängige Knoten `documentId` leer lassen (`null`) und Metadaten sauber setzen.

---

### Problem: Suche liefert keine Treffer trotz vorhandener Daten

**Symptom:** `/api/search?q=...` liefert leere Arrays.

**Häufige Ursachen:**

- Anfrage ohne Tenant-Header (falscher Datenraum),
- `type`-Filter schränkt zu stark ein (`documents` oder `knowledge`),
- Suchbegriff kommt nur in HTML/Metadaten vor und nicht im erwarteten Feld.

**Lösungen:**

```bash
# Beide Quellen durchsuchen (ohne type)
curl -H "X-Tenant-ID: <tenant-id>" "http://localhost:3002/api/search?q=backup"

# Nur Knowledge Nodes
curl -H "X-Tenant-ID: <tenant-id>" "http://localhost:3002/api/search?q=backup&type=knowledge"
```

---

### Problem: Analytics-Endpoint schlägt fehl

**Symptom:** `GET /api/analytics` gibt 400 oder 500 zurück.

**Prüfung:**

1. Ist Tenant-Kontext vorhanden?
2. Läuft Datenbankzugriff stabil?
3. Sind Migrationsstand und Prisma-Client aktuell?

**Lösungen:**

- Tenant-Header mitsenden.
- `npx prisma generate` ausführen.
- Backend-Logs auf fehlende Tabellen/Felder prüfen.
