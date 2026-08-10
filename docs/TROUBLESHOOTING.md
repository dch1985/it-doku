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

- Prüfe ob der konfigurierte Port frei ist (Default aus `backend/env.sample`: 3002): `netstat -ano | findstr :3002`
- Starte Backend: `cd backend && npm run dev`

### Frontend kann Backend nicht erreichen

- Prüfe CORS-Einstellungen im Backend
- Prüfe ob `VITE_API_URL` in `frontend/.env` korrekt gesetzt ist
- Prüfe Browser-Konsole für CORS-Fehler

### Datenbank-Fehler

- Prüfe `DATABASE_URL` in `backend/.env`
- Führe Prisma Migrationen aus: `npx prisma migrate dev`
- Generiere Prisma Client: `npx prisma generate`

## Problem: "Tenant identifier required"

### Ursache

Tenant-gebundene Endpoints (z. B. `/api/automation`, `/api/compliance`, `/api/knowledge`, `/api/assistant`, `/api/search`, `/api/analytics`) wurden ohne Tenant-Kontext aufgerufen.

### Lösungen

1. Header setzen:
   - `X-Tenant-ID: <tenant-id>` oder
   - `X-Tenant-Slug: <tenant-slug>`
2. Prüfen, ob der Benutzer Tenant-Mitglied ist.
3. Für lokale Entwicklung optional `DEV_AUTH_ENABLED=true` in `backend/.env` setzen.

---

## Problem: Connector lässt sich nicht aktivieren/deaktivieren (403)

### Typisches Symptom

`PATCH /api/automation/connectors/:id` schlägt fehl, obwohl Auth und Tenant korrekt sind.

### Ursache

Der Connector ist global (`tenantId = null`). Globale Connectoren sind absichtlich nicht tenant-seitig änderbar.

### Lösung

- Nur tenant-spezifische Connectoren umschalten.
- Für globale Connector-Änderungen Admin-/Systempfad verwenden.

---

## Problem: Service-Bus-Fehler beim Start von Queue/Worker

### Typische Fehlermeldung

`Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.`

### Ursache

`AUTOMATION_QUEUE_PROVIDER=servicebus`, aber benötigte Variablen fehlen.

### Lösungen

1. Entweder beide Variablen setzen:
   - `AZURE_SERVICE_BUS_CONNECTION_STRING`
   - `AZURE_SERVICE_BUS_QUEUE_NAME`
2. Oder lokal auf `AUTOMATION_QUEUE_PROVIDER=memory` zurückstellen.

---

## Problem: Automationsjobs werden erstellt, aber nicht verarbeitet

### Ursache

Queue/Run-Modus passt nicht zum Deployment:

- `AUTOMATION_QUEUE_AUTORUN=false` und `AUTOMATION_RUN_IMMEDIATE=false` → Job bleibt stehen.

### Lösungen

1. Für direkten Lauf:
   - `AUTOMATION_RUN_IMMEDIATE=true`
2. Für Queue-Betrieb:
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - Worker starten: `cd backend && npm run automation:worker`
3. Einzeljob manuell:
   - `cd backend && npm run automation:job -- <jobId>`

---

## Problem: Quality Check schlägt mit 400 fehl

### Typisches Symptom

`POST /api/compliance/quality/check` liefert `documentId ist erforderlich`.

### Lösung

Payload immer mit Dokument-ID senden:

```json
{
  "documentId": "<document-id>"
}
```

Wenn `documentId` gesetzt ist und der Fehler bleibt:

- Prüfen, ob das Dokument im Tenant existiert.

---

## Problem: Review-Update schlägt mit "Ungültiger Review-Status" fehl

### Ursache

Ungültiger Statuswert in `PATCH /api/compliance/reviews/:id`.

### Erlaubte Werte

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CHANGES_REQUESTED`

Statuswerte immer uppercase senden.

---

## Problem: Suche liefert zu wenige/keine Treffer

### Prüfpunkte

1. `q`-Parameter ist gesetzt und nicht leer.
2. Tenant-Header stimmt.
3. `type` korrekt:
   - `documents`
   - `knowledge`
4. Bei Knowledge-Treffern prüfen, ob Nodes dem Tenant zugeordnet sind (`documentId` oder Tenant-Metadaten bei Orphans).
