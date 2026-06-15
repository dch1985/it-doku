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
- Prüfe ob Port 3002 frei ist (Linux): `ss -ltnp | rg 3002`
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

## Automate / Queue Probleme

### Problem: Jobs bleiben dauerhaft auf `PENDING`

**Symptome:**
- `POST /api/automation/jobs` funktioniert.
- `GET /api/automation/jobs` zeigt Status dauerhaft `PENDING`.

**Ursache:**
- `AUTOMATION_QUEUE_AUTORUN=false` **und** `AUTOMATION_RUN_IMMEDIATE=false`.
- In dieser Kombination wird kein automatischer Verarbeitungsfluss gestartet.

**Lösungen:**
1. Für synchrone Verarbeitung:
   ```env
   AUTOMATION_QUEUE_AUTORUN=false
   AUTOMATION_RUN_IMMEDIATE=true
   ```
2. Oder Job manuell ausführen:
   ```bash
   cd backend
   npm run automation:job -- <jobId>
   ```

### Problem: Service Bus Fehler beim Start

**Fehlermeldung (typisch):**
```
Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.
```

**Lösung:**
- Wenn `AUTOMATION_QUEUE_PROVIDER=servicebus`, setze beide Variablen:
  - `AZURE_SERVICE_BUS_CONNECTION_STRING`
  - `AZURE_SERVICE_BUS_QUEUE_NAME`
- Alternativ lokal auf `AUTOMATION_QUEUE_PROVIDER=memory` wechseln.

### Problem: Connector kann nicht aktiviert/deaktiviert werden

**Fehlermeldung (typisch):**
```
Globale Connectoren können nicht angepasst werden
```

**Ursache:**
- Der Connector ist global (`tenantId = null`).

**Lösung:**
- Nutze einen tenant-spezifischen Connector (per `POST /api/automation/connectors`) oder passe globale Connectoren nur über System-Administration an.

---

## Centralize / Knowledge Probleme

### Problem: Knowledge Node kann nicht erstellt/aktualisiert werden (403)

**Fehlermeldung (typisch):**
```
Zugriff auf das Dokument ist nicht erlaubt
```
oder
```
Zugriff verweigert
```

**Ursache:**
- `documentId` gehört zu einem anderen Tenant oder Node-Metadaten gehören einem anderen Tenant.

**Lösung:**
- Prüfe `X-Tenant-ID` Header.
- Verknüpfe Knowledge Nodes nur mit Dokumenten aus demselben Tenant.

### Problem: Assistant liefert Antworten ohne Quellen

**Ursache:**
- Es existieren keine passenden Dokumente/Knowledge Nodes im aktiven Tenant-Kontext.

**Lösung:**
- Relevante Knowledge Nodes via `POST /api/knowledge` ergänzen.
- Dokumentinhalte auf Suchbegriffe prüfen (Assistant sucht derzeit keyword-basiert in Dokumenten + Knowledge Nodes).

---

## Comply / Quality & Review Probleme

### Problem: Quality Check startet nicht

**Fehlermeldung (typisch):**
```
documentId ist erforderlich
```

**Lösung:**
- `POST /api/compliance/quality/check` immer mit gültiger `documentId` aufrufen.

### Problem: Finding kann nicht aktualisiert werden

**Fehlermeldung (typisch):**
```
Ungültige Aktion: <...>
```
oder
```
Keine Änderungen angegeben
```

**Lösung:**
- Nur `RESOLVE` oder `REOPEN` als `action` senden.
- Für reine Textanpassung `resolution` mitgeben.

### Problem: Review Request kann nicht erstellt werden

**Fehlermeldung (typisch):**
```
Reviewer wurde nicht gefunden
```
oder
```
Dokument wurde nicht gefunden
```

**Lösung:**
- Sicherstellen, dass `reviewerId` auf einen existierenden Benutzer zeigt.
- Sicherstellen, dass `documentId` im aktiven Tenant vorhanden ist.

### Problem: Reviewer-Dropdown bleibt leer

**Symptom:**
- Frontend zeigt keine auswählbaren Reviewer für `Review anstoßen`.

**Diagnose:**
- Prüfe im Browser-Netzwerk, ob `/api/users` mit `404` antwortet.
- Prüfe, ob die Users-Route im Backend registriert ist (`backend/src/index.ts`).

---

## Multi-Tenant Diagnose-Snippet

Wenn Requests unerwartet mit 400/403 fehlschlagen, zuerst Tenant-Kontext prüfen:

```bash
curl http://localhost:3002/api/analytics \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

Ohne gültigen Tenant-Kontext schlagen viele `/api/automation`, `/api/knowledge` und `/api/compliance` Aufrufe fehl.

