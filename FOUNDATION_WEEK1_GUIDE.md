# 🚀 FOUNDATION - WEEK 1 IMPLEMENTATION GUIDE

## 📋 Übersicht

Diese Anleitung führt dich Schritt für Schritt durch die Foundation-Phase deines it-doku Projekts. Alle Commands sind für Windows PowerShell optimiert.

---

## ✅ TAG 1-2: STATE MANAGEMENT SETUP

### Schritt 1: Dependencies installieren

```powershell
cd C:\Users\DrissChaouat\Code\it-doku\frontend-new

# Zustand + Immer für State Management
npm install zustand immer

# Development Dependencies
npm install -D @types/node
```

### Schritt 2: Store-Struktur erstellen

Erstelle folgende Ordnerstruktur:

```powershell
# Stores-Verzeichnis erstellen
New-Item -ItemType Directory -Path "src\stores" -Force

# Hook-Verzeichnis erstellen
New-Item -ItemType Directory -Path "src\hooks" -Force
```

**Kopiere diese Dateien in dein Projekt:**

1. `src/stores/useAppStore.ts` → Globaler App State
2. `src/stores/useDocumentStore.ts` → Dokumenten-Management
3. `src/stores/useConversationStore.ts` → AI Chat Management
4. `src/stores/index.ts` → Central Exports

### Schritt 3: Stores in App integrieren

Öffne `src/main.tsx` oder `src/App.tsx` und füge hinzu:

```typescript
// In main.tsx ODER App.tsx
import { useAppStore } from './stores';

// Theme von Store anwenden
const App = () => {
  const { settings } = useAppStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  // Rest deiner App...
}
```

### Schritt 4: Bestehende Context-Provider ersetzen

**VORHER (Alt):**
```typescript
// contexts/AIContext.tsx
const [messages, setMessages] = useState([]);
```

**NACHHER (Neu mit Zustand):**
```typescript
import { useConversationStore } from '@/stores';

const MyComponent = () => {
  const { conversations, addMessage } = useConversationStore();
  // ... use store instead of local state
}
```

---

## ✅ TAG 3: DATABASE SCHEMA ERWEITERN

### Schritt 1: Backend vorbereiten

```powershell
cd C:\Users\DrissChaouat\Code\it-doku\backend

# Prisma Schema updaten
code prisma/schema.prisma
```

### Schritt 2: Neues Schema einfügen

Ersetze die `prisma/schema.prisma` mit der erweiterten Version aus diesem Guide.

**Wichtige neue Models:**
- `Conversation` & `Message` → AI Chat Persistence
- `KnowledgeNode` → Für Knowledge Graph (später)
- `ActivityLog` → Tracking & Analytics
- `ApiKey` → API Management

### Schritt 3: Migration erstellen & ausführen

```powershell
# Prisma Client regenerieren
npx prisma generate

# Migration erstellen
npx prisma migrate dev --name foundation_v2

# Datenbank inspizieren (optional)
npx prisma studio
```

### Schritt 4: Seed-Daten (optional)

```powershell
# Seed-Script erstellen
New-Item -ItemType File -Path "prisma\seed.ts" -Force
```

Beispiel `seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Test User
  await prisma.user.upsert({
    where: { email: 'admin@it-doku.com' },
    update: {},
    create: {
      email: 'admin@it-doku.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Test Templates
  await prisma.template.createMany({
    data: [
      {
        name: 'API Documentation',
        description: 'Standard API documentation template',
        category: 'API',
        content: '# API Documentation\n\n...',
        structure: {},
      },
      // Add more templates...
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

```powershell
# Seed ausführen
npx prisma db seed
```

---

## ✅ TAG 4: ERROR HANDLING & BOUNDARIES

### Schritt 1: Error Boundary Setup

```powershell
cd C:\Users\DrissChaouat\Code\it-doku\frontend-new

# Components-Verzeichnis erstellen (falls nicht vorhanden)
New-Item -ItemType Directory -Path "src\components" -Force
```

**Kopiere diese Dateien:**
1. `src/components/ErrorBoundary.tsx`
2. `src/components/Toast.tsx`
3. `src/components/Loading.tsx`

### Schritt 2: Error Boundary in App integrieren

In `App.tsx`:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
      <ToastContainer />
    </ErrorBoundary>
  );
}
```

### Schritt 3: API Client Setup

```powershell
# Hooks-Verzeichnis erstellen
New-Item -ItemType Directory -Path "src\hooks" -Force
```

**Kopiere:** `src/hooks/useApi.ts`

### Schritt 4: API Client verwenden

Beispiel Component:

```typescript
import { useApi, documentApi } from '@/hooks/useApi';
import { useToast } from '@/components/Toast';
import { LoadingState, SkeletonCard } from '@/components/Loading';

function DocumentList() {
  const toast = useToast();
  
  const { data, loading, error, execute } = useApi(
    documentApi.getAll,
    {
      onSuccess: () => toast.success('Documents loaded'),
      onError: (err) => toast.error('Failed to load documents', err.message),
    }
  );

  useEffect(() => {
    execute();
  }, []);

  return (
    <LoadingState isLoading={loading} skeleton={<SkeletonCard />}>
      {data && <div>{/* Render documents */}</div>}
    </LoadingState>
  );
}
```

---

## ✅ TAG 5: PERFORMANCE OPTIMIERUNG

### Schritt 1: Bundle Analyzer installieren

```powershell
cd C:\Users\DrissChaouat\Code\it-doku\frontend-new

npm install -D vite-plugin-bundle-analyzer
```

### Schritt 2: Vite Config erweitern

In `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { analyzer } from 'vite-plugin-bundle-analyzer';

export default defineConfig({
  plugins: [
    react(),
    analyzer({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', '@radix-ui/react-dialog'],
          'vendor-state': ['zustand', 'immer'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Schritt 3: Code Splitting für Routes

```typescript
// router.tsx
import { lazy, Suspense } from 'react';
import { Spinner } from './components/Loading';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const CodeAnalysis = lazy(() => import('./pages/CodeAnalysis'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Spinner size="xl" />}>
        <Dashboard />
      </Suspense>
    ),
  },
  // ... more routes
]);
```

### Schritt 4: Bundle analysieren

```powershell
# Production Build mit Analyse
npm run build

# Report öffnet sich automatisch
# Oder manuell: .\dist\bundle-report.html
```

---

## ✅ TAG 6-7: TESTING SETUP

### Schritt 1: Testing Dependencies

```powershell
cd C:\Users\DrissChaouat\Code\it-doku\frontend-new

# Vitest + Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Schritt 2: Vitest Config

Erstelle `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Schritt 3: Test Setup

```powershell
# Test-Verzeichnis erstellen
New-Item -ItemType Directory -Path "src\test" -Force

# Setup-File erstellen
New-Item -ItemType File -Path "src\test\setup.ts" -Force
```

In `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Schritt 4: Erste Tests schreiben

Beispiel: `src/stores/useAppStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      settings: {
        theme: 'dark',
        sidebarCollapsed: false,
        language: 'de',
        notifications: true,
      },
    });
  });

  it('should toggle theme', () => {
    const { toggleTheme, settings } = useAppStore.getState();
    
    expect(settings.theme).toBe('dark');
    
    toggleTheme();
    
    expect(useAppStore.getState().settings.theme).toBe('light');
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar, settings } = useAppStore.getState();
    
    expect(settings.sidebarCollapsed).toBe(false);
    
    toggleSidebar();
    
    expect(useAppStore.getState().settings.sidebarCollapsed).toBe(true);
  });
});
```

### Schritt 5: Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Schritt 6: Tests ausführen

```powershell
# Einmalig ausführen
npm test

# Watch-Mode
npm run test:watch

# Mit UI
npm run test:ui

# Coverage Report
npm run test:coverage
```

---

## 📊 WEEK 1 CHECKLIST

```
✅ State Management
  ✓ Zustand Stores installiert
  ✓ App Store erstellt
  ✓ Document Store erstellt
  ✓ Conversation Store erstellt
  ✓ Bestehende Context-Provider migriert

✅ Database Schema
  ✓ Prisma Schema erweitert
  ✓ Migration erstellt & ausgeführt
  ✓ Seed-Daten hinzugefügt (optional)
  ✓ Prisma Studio getestet

✅ Error Handling
  ✓ Error Boundary implementiert
  ✓ Toast System erstellt
  ✓ API Client mit Retry-Logic
  ✓ Loading States & Skeletons

✅ Performance
  ✓ Bundle Analyzer setup
  ✓ Code Splitting konfiguriert
  ✓ Manual Chunks definiert
  ✓ Bundle < 500KB confirmed

✅ Testing
  ✓ Vitest installiert
  ✓ Testing Library setup
  ✓ Erste Unit Tests geschrieben
  ✓ Coverage > 50%
```

---

## 🎯 NEXT STEPS (WEEK 2)

Nach Week 1 Foundation solltest du haben:
- Solid State Management mit Zustand
- Erweiterte Database mit allen benötigten Models
- Robustes Error Handling
- Optimierte Performance
- Grundlegende Tests

**Week 2 Fokus:**
1. React Query Integration (API Caching)
2. Advanced Loading States
3. Offline Support
4. E2E Tests mit Playwright
5. CI/CD Pipeline Setup

---

## 🚨 TROUBLESHOOTING

### Problem: Prisma Migration fails

```powershell
# Reset Database (ACHTUNG: Löscht alle Daten!)
npx prisma migrate reset --force

# Fresh Start
npx prisma migrate dev --name init
```

### Problem: TypeScript Errors nach Zustand Installation

```powershell
# tsconfig.json prüfen
# Stelle sicher dass path alias konfiguriert ist:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Problem: Tests laufen nicht

```powershell
# Cache clearen
npm run test -- --clearCache

# Node Modules neu installieren
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

---

## 📚 RESSOURCEN

- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

**Status:** Ready to implement! 🚀
**Geschätzte Zeit:** 6-7 Tage
**Impact:** 🔥🔥🔥🔥🔥 (Foundation für alles!)

---

Bei Fragen oder Problemen, einfach melden! 💪
