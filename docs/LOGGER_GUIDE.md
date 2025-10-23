# 📝 Logger Utility - Verwendungsanleitung

## Übersicht

Die Logger-Utility ersetzt alle `console.log/error/warn` Aufrufe durch ein strukturiertes Logging-System mit Environment-basierter Konfiguration.

## Vorteile

✅ **Production-sicher**: Nur Errors werden in Production geloggt
✅ **Strukturiert**: Timestamps und Log-Levels
✅ **Erweiterbar**: Einfache Integration von Error-Tracking (Sentry, LogRocket)
✅ **Type-safe**: Vollständig TypeScript-typisiert
✅ **Performance**: Zero-overhead in Production

## Import

```typescript
import { logger } from '../utils/logger';
// oder
import logger from '../utils/logger';
```

## Verwendung

### Standard Log (Development only)
```typescript
logger.log('User clicked button', { buttonId: 'submit' });
```

### Info Log (Development only)
```typescript
logger.info('Document loaded successfully', { documentId: '123' });
```

### Warning Log (Immer aktiv)
```typescript
logger.warn('Deprecated function used', { function: 'oldApi' });
```

### Error Log (Immer aktiv)
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, { context: 'additional info' });
}
```

### Debug Log (Development only, detailliert)
```typescript
logger.debug('Processing data', { 
  data: complexObject,
  timestamp: Date.now() 
});
```

### Gruppierte Logs
```typescript
logger.group('User Authentication', () => {
  logger.log('Step 1: Validating credentials');
  logger.log('Step 2: Checking permissions');
  logger.log('Step 3: Creating session');
});
```

### Performance Messung
```typescript
logger.time('API Call');
await fetch('/api/documents');
logger.timeEnd('API Call'); // Zeigt: "API Call: 245ms"
```

### Table Output (Arrays/Objects)
```typescript
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];
logger.table(users);
```

## Migration Guide

### Vorher (❌)
```typescript
console.log('Document created:', document);
console.error('Failed to save:', error);
console.warn('Missing field:', field);
```

### Nachher (✅)
```typescript
logger.info('Document created', { document });
logger.error('Failed to save document', error);
logger.warn('Missing required field', { field });
```

## Beispiele aus dem Projekt

### In useDocuments Hook
```typescript
// Vorher
console.log('Fetching documents...');

// Nachher
logger.info('Fetching documents from API');
logger.time('Document Fetch');
const response = await documentService.getAll();
logger.timeEnd('Document Fetch');
```

### In DocumentCard Component
```typescript
// Vorher
console.log('Deleting document:', id);

// Nachher
logger.info('Initiating document deletion', { documentId: id });
try {
  await deleteDocument(id);
  logger.info('Document deleted successfully', { documentId: id });
} catch (error) {
  logger.error('Failed to delete document', error, { documentId: id });
}
```

### In API Services
```typescript
// documentService.ts
export const documentService = {
  async getAll(): Promise<Document[]> {
    logger.debug('API: Fetching all documents');
    
    try {
      const response = await apiClient.get('/documents');
      logger.info('API: Documents fetched', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('API: Failed to fetch documents', error);
      throw error;
    }
  }
};
```

## Error Tracking Integration

### Sentry Integration (Optional)
```typescript
// In logger.ts
error: (message: string, error?: unknown, ...args: any[]): void => {
  // ... existing code ...
  
  // Send to Sentry
  if (window.Sentry && error instanceof Error) {
    window.Sentry.captureException(error, {
      tags: { message },
      extra: { args }
    });
  }
}
```

## Best Practices

### ✅ DO
- Verwende `logger.info()` für wichtige Geschäftslogik
- Verwende `logger.error()` für alle Fehler mit Context
- Verwende `logger.debug()` für detaillierte Entwickler-Infos
- Füge relevanten Context hinzu (IDs, User-Info, etc.)

### ❌ DON'T
- Verwende nicht mehr `console.log` direkt
- Logge keine sensitiven Daten (Passwörter, Tokens)
- Übertreibe es nicht mit Logging (Performance)

## Konfiguration

In `utils/logger.ts` kannst du die Konfiguration anpassen:

```typescript
const config: LoggerConfig = {
  enabledInProduction: false, // true für Production-Logs
  enabledLevels: ['log', 'info', 'warn', 'error', 'debug'],
};
```

## Environment-Check

Der Logger erkennt automatisch die Environment:
- **Development**: Alle Logs aktiv mit Timestamps
- **Production**: Nur Errors & Warnings

```typescript
const isDevelopment = import.meta.env.MODE === 'development';
```

## TypeScript Support

Der Logger ist vollständig typisiert:

```typescript
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

logger.log(message: string, ...args: any[]): void
logger.info(message: string, ...args: any[]): void
logger.warn(message: string, ...args: any[]): void
logger.error(message: string, error?: unknown, ...args: any[]): void
logger.debug(message: string, data?: any): void
```

## Testing

Im Testing-Environment werden alle Logs unterdrückt:

```typescript
// In test setup
vi.mock('../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));
```

## Nächste Schritte

1. ✅ Logger erstellt
2. ⚠️ Alle `console.*` Aufrufe durch `logger.*` ersetzen
3. ⚠️ Error-Tracking-Service integrieren (Sentry)
4. ⚠️ Log-Level-Filter im UI hinzufügen (für Development)

## Support

Bei Fragen zur Logger-Verwendung:
- Siehe diese Dokumentation
- Prüfe Beispiele in `DocumentList.tsx`
- Schaue in `logger.ts` für Implementation-Details
