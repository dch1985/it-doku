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

- Prüfe ob Port 3002 frei ist: `lsof -i :3002` (Linux/macOS) oder `netstat -ano | findstr :3002` (Windows)
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

## Problem: `Tenant identifier required`

### Ursache

Mehrere API-Bereiche (`/api/automation`, `/api/compliance`, `/api/knowledge`, `/api/assistant`, `/api/search`, `/api/analytics`) laufen über `tenantMiddleware` und erwarten Tenant-Kontext.

### Lösung

1. Header mitgeben:
   - `X-Tenant-ID: <tenant-id>` oder
   - `X-Tenant-Slug: <tenant-slug>`
2. In der UI sicherstellen, dass ein Tenant ausgewählt ist.
3. Nur für lokale Entwicklung: `NODE_ENV=development` oder `DEV_AUTH_ENABLED=true` erlaubt fehlende Tenant-Header bei authentifiziertem User.

Beispiel:

```bash
curl "http://localhost:3002/api/automation/jobs" \
  -H "X-Tenant-ID: <tenant-id>"
```

---

## Problem: Automationsjobs bleiben auf `PENDING`

### Häufige Ursachen

1. `AUTOMATION_RUN_IMMEDIATE=false` und `AUTOMATION_QUEUE_AUTORUN=false`
   → Jobs werden erstellt, aber nicht automatisch verarbeitet.
2. `AUTOMATION_QUEUE_PROVIDER=memory` in Multi-Prozess-/Cloud-Szenarien
   → Memory-Queue ist pro Prozess isoliert.
3. Service Bus ist gewählt, aber nicht korrekt konfiguriert.

### Lösungen

1. Für lokale synchrone Verarbeitung:
   - `AUTOMATION_RUN_IMMEDIATE=true`
   - `AUTOMATION_QUEUE_AUTORUN=false`
2. Für Queue-basierte Verarbeitung:
   - `AUTOMATION_QUEUE_AUTORUN=true`
   - `AUTOMATION_QUEUE_PROVIDER=servicebus`
3. Für manuelle Verarbeitung:
   - `npm run automation:job -- <jobId>`

---

## Problem: `Service Bus Provider ausgewählt, aber ... fehlt`

### Ursache

`AUTOMATION_QUEUE_PROVIDER=servicebus`, aber eine oder beide Variablen fehlen:

- `AZURE_SERVICE_BUS_CONNECTION_STRING`
- `AZURE_SERVICE_BUS_QUEUE_NAME`

### Lösung

Setze beide Variablen in `backend/.env` bzw. Deployment-Settings und starte Backend/Worker neu.

---

## Problem: Knowledge Nodes tauchen nicht in Search/Assistant auf

### Ursache

`/api/search` und `/api/assistant/query` berücksichtigen Knowledge Nodes tenant-spezifisch über Dokumentbezug.
Nodes ohne `documentId` können in diesen Flows fehlen, auch wenn sie in `/api/knowledge` sichtbar sind.

### Lösung

1. Node einem Dokument desselben Tenants zuordnen (`documentId` setzen).
2. Bei tenant-losen Nodes Metadaten prüfen (`tenantId` in metadata).
3. Danach Search/Assistant erneut testen.

---

## Problem: Compliance Findings kommen nach Re-Check wieder

### Ursache

`POST /api/compliance/quality/check` erstellt Findings anhand regelbasierter Textprüfungen, z. B.:

- Platzhaltertext (`lorem ipsum`, `dummy text`)
- Klartext-Passwortmuster (`password: ...`)
- fehlender Review-Hinweis
- fehlender Owner/Verantwortlichkeits-Hinweis

### Lösung

1. Dokumentinhalt entsprechend bereinigen/ergänzen.
2. Quality Check erneut ausführen.
3. Findings erst dann als gelöst markieren, wenn die Ursache im Dokument behoben ist.

---

## Problem: Connector kann nicht deaktiviert/aktiviert werden

### Ursache

`PATCH /api/automation/connectors/:id` erlaubt keine Änderungen an globalen Connectoren (`tenantId=null`).

### Lösung

1. Tenant-spezifischen Connector verwenden oder anlegen.
2. Für globale Connectoren Änderung über System-Administration durchführen.
