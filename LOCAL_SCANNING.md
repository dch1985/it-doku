# Local Scanning Feature - Dokumentation

## Übersicht

Das **Local Scanning Feature** ermöglicht es dir, lokale Verzeichnisse auf deinem Windows- oder Unix-System zu scannen und IT-relevante Dateien automatisch zu identifizieren.

## Features

### 🔍 Intelligente Datei-Erkennung
- **Konfigurationsdateien**: `.conf`, `.config`, `.cfg`, `.ini`, `.yaml`, `.yml`, `.json`, `.xml`
- **Dokumentation**: `.md`, `.txt`, `.doc`, `.docx`, `.pdf`
- **Scripts**: `.sh`, `.bat`, `.ps1`, `.cmd`
- **Source Code**: `.js`, `.ts`, `.py`, `.java`, `.cs`, `.cpp`, `.c`, `.go`, `.rb`
- **Logs**: `.log`
- **Datenbanken**: `.sql`, `.db`, `.sqlite`
- **Container**: `Dockerfile`, `docker-compose.yml`
- **Infrastructure as Code**: `.tf`, `.tfvars`

### 📊 Statistiken
- Gesamtanzahl Dateien und Verzeichnisse
- Gesamtgröße aller Dateien
- Kategorisierung nach Dateitypen
- Erweiterungen-Übersicht

### 🎯 Flexible Filterung
- Nach Kategorien filtern (Konfiguration, Dokumentation, Scripts, etc.)
- Nach Dateityp filtern (Dateien/Verzeichnisse)
- Konfigurierbare Scan-Tiefe (1-10 Ebenen)

### 🚫 Automatische Ausschlüsse
Folgende Verzeichnisse werden automatisch übersprungen:
- `node_modules`
- `.git`
- `.vscode`
- `.idea`
- `dist`
- `build`
- `target`
- `__pycache__`
- `.next`
- `coverage`

## Installation & Setup

### 1. Backend starten

```bash
cd backend
npm install
npm run dev
```

Das Backend läuft auf: `http://localhost:3001`

### 2. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend läuft auf: `http://localhost:5173`

## Verwendung

### Via Web-Interface

1. Öffne die Anwendung im Browser: `http://localhost:5173`
2. Klicke auf den **Plus-Button** (⊕) rechts unten
3. Gib den Pfad zum Scannen ein:
   - **Windows**: `C:\Users\DrissChaouat\Code\it-doku`
   - **Unix**: `/home/user/projekt`
   - **Relativ**: `.\relative\path`
4. Wähle die Scan-Tiefe (Standard: 3)
5. Klicke auf **"Verzeichnis Scannen"**

### Via API (cURL)

#### Windows-Pfad scannen:

```bash
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d "{
    \"path\": \"C:\\\\Users\\\\DrissChaouat\\\\Code\\\\it-doku\",
    \"maxDepth\": 3,
    \"includeStatistics\": true
  }"
```

#### Unix-Pfad scannen:

```bash
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/home/user/projekt",
    "maxDepth": 3,
    "includeStatistics": true
  }'
```

### Via JavaScript/TypeScript

```typescript
import { scannerAPI } from './api/scanner';

// Verzeichnis scannen
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Users\\DrissChaouat\\Code\\it-doku',
  maxDepth: 3,
  includeStatistics: true,
});

console.log('Gefundene Dateien:', result.statistics?.totalFiles);
console.log('Gesamtgröße:', scannerAPI.formatBytes(result.statistics?.totalSize));
console.log('Ergebnisse:', result.results);
```

## API-Referenz

### POST /api/scan

Scannt ein lokales Verzeichnis und gibt IT-relevante Dateien zurück.

#### Request Body

```typescript
{
  path: string;                    // Pfad zum Scannen (erforderlich)
  maxDepth?: number;               // Max. Tiefe (1-10, Standard: 3)
  includeExtensions?: string[];    // Benutzerdefinierte Extensions
  excludePatterns?: string[];      // Zusätzliche Ausschlüsse
  includeStatistics?: boolean;     // Statistiken einbeziehen (Standard: true)
}
```

#### Response

```typescript
{
  success: boolean;
  path: string;
  scannedAt: string;               // ISO-8601 Timestamp
  results: ScanResult[];           // Array von Dateien/Verzeichnissen
  statistics?: {
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;             // in Bytes
    categories: Record<string, number>;
    extensions: Record<string, number>;
  };
}
```

#### ScanResult Struktur

```typescript
{
  path: string;                    // Vollständiger Pfad
  name: string;                    // Datei-/Verzeichnisname
  type: 'file' | 'directory';      // Typ
  size?: number;                   // Größe in Bytes (nur Dateien)
  extension?: string;              // Datei-Extension (nur Dateien)
  category?: string;               // Kategorie (nur Dateien)
  lastModified?: Date;             // Letzte Änderung
}
```

## Kategorien

Die Dateien werden automatisch in folgende Kategorien eingeordnet:

| Kategorie | Beschreibung | Extensions |
|-----------|-------------|------------|
| **configuration** | Konfigurationsdateien | `.conf`, `.config`, `.cfg`, `.ini`, `.yaml`, `.yml`, `.json`, `.xml` |
| **documentation** | Dokumentation | `.md`, `.txt`, `.doc`, `.docx`, `.pdf` |
| **script** | Ausführbare Scripts | `.sh`, `.bat`, `.ps1`, `.cmd` |
| **source-code** | Quellcode | `.js`, `.ts`, `.py`, `.java`, `.cs`, `.cpp`, `.c`, `.go`, `.rb` |
| **log** | Log-Dateien | `.log` |
| **database** | Datenbank-Dateien | `.sql`, `.db`, `.sqlite` |
| **container** | Container-Definitionen | `Dockerfile`, `docker-compose.yml` |
| **infrastructure** | Infrastructure as Code | `.tf`, `.tfvars` |
| **other** | Sonstige | Alle anderen erkannten Dateien |

## Erweiterte Konfiguration

### Benutzerdefinierte Extensions

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Projekt',
  includeExtensions: ['.log', '.txt', '.csv', '.xlsx'],
});
```

### Zusätzliche Ausschlüsse

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Projekt',
  excludePatterns: ['node_modules', 'temp', 'cache', 'backup'],
});
```

### Maximale Scan-Tiefe

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Projekt',
  maxDepth: 10,  // Scannt bis zu 10 Ebenen tief
});
```

## Beispiele

### Beispiel 1: IT-Projekt scannen

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Users\\DrissChaouat\\Code\\it-doku',
  maxDepth: 5,
});

console.log(`
📂 Scan-Ergebnis für: ${result.path}
📅 Gescannt am: ${new Date(result.scannedAt).toLocaleString('de-DE')}

📊 Statistiken:
   - Dateien: ${result.statistics?.totalFiles}
   - Verzeichnisse: ${result.statistics?.totalDirectories}
   - Gesamtgröße: ${scannerAPI.formatBytes(result.statistics?.totalSize || 0)}

📑 Kategorien:
${Object.entries(result.statistics?.categories || {})
  .map(([cat, count]) => `   - ${cat}: ${count} Dateien`)
  .join('\n')}
`);
```

### Beispiel 2: Nur Konfigurationsdateien

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Projekt',
  includeExtensions: ['.conf', '.config', '.yaml', '.yml', '.json'],
  maxDepth: 3,
});

// Filtere nur Konfigurationsdateien
const configFiles = result.results.filter(r => r.category === 'configuration');
console.log('Konfigurationsdateien:', configFiles);
```

### Beispiel 3: Dokumentation finden

```typescript
const result = await scannerAPI.scanDirectory({
  path: 'C:\\Projekt',
  includeExtensions: ['.md', '.txt', '.pdf'],
});

const docs = result.results.filter(r => r.category === 'documentation');
console.log(`Gefunden: ${docs.length} Dokumentations-Dateien`);
```

## Sicherheit

⚠️ **Wichtige Hinweise**:

1. **Berechtigungen**: Der Scanner kann nur auf Dateien/Verzeichnisse zugreifen, für die der Node.js-Prozess Leserechte hat
2. **Symlinks**: Standardmäßig werden Symlinks NICHT verfolgt (Schutz vor Endlosschleifen)
3. **Fehlende Berechtigungen**: Dateien ohne Leserechte werden übersprungen (mit Warnung im Log)
4. **Pfad-Validierung**: Der Scanner prüft, ob der Pfad existiert, bevor er startet

## Fehlerbehebung

### "Pfad existiert nicht"

```bash
# Windows: Prüfe ob Pfad existiert
dir "C:\Users\DrissChaouat\Code\it-doku"

# Unix: Prüfe ob Pfad existiert
ls -la /home/user/projekt
```

### "Keine Berechtigung"

```bash
# Windows: Als Administrator ausführen
# Unix: Prüfe Berechtigungen
ls -la /pfad/zum/verzeichnis
```

### Backend nicht erreichbar

```bash
# Prüfe ob Backend läuft
curl http://localhost:3001/api/health

# Sollte zurückgeben:
# {"status":"OK","message":"Backend API is running!","timestamp":"...","version":"1.0.0"}
```

## Performance

- **Schnell**: ~1000 Dateien/Sekunde auf modernen SSDs
- **Effizient**: Asynchrone Verarbeitung mit Node.js
- **Skalierbar**: Konfigurierbare Scan-Tiefe zur Leistungsoptimierung

### Performance-Tipps

1. **Reduziere Scan-Tiefe**: Nutze `maxDepth: 2-3` für große Projekte
2. **Spezifische Extensions**: Definiere nur benötigte Extensions
3. **Ausschlüsse nutzen**: Überspringe große Verzeichnisse wie `node_modules`

## Roadmap

### Version 1.1
- [ ] Export-Funktionen (CSV, JSON, Excel)
- [ ] Speichern von Scan-Ergebnissen in Datenbank
- [ ] Vergleich von Scan-Ergebnissen (Diff)
- [ ] Batch-Scanning mehrerer Verzeichnisse

### Version 1.2
- [ ] Datei-Inhalt-Analyse (Text-Extraktion)
- [ ] Git-Integration (Repository-Informationen)
- [ ] Duplikaterkennung
- [ ] Empfehlungen für Optimierungen

### Version 2.0
- [ ] KI-gestützte Datei-Kategorisierung
- [ ] Automatische Dokumentation-Generierung
- [ ] Integration mit Cloud-Storage (Azure Blob, AWS S3)
- [ ] Real-time File System Watching

## Support

Bei Fragen oder Problemen:
- **Issues**: [GitHub Issues](https://github.com/dch1985/it-doku/issues)
- **E-Mail**: dchaouat@chaouat-consulting.de

---

**Entwickelt mit ❤️ für das IT-Doku Projekt**
