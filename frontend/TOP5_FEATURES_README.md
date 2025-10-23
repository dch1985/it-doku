# 🚀 TOP 5 Features - Installation & Setup

## ✅ Implementierte Features

1. **📝 Markdown-Editor** mit Live-Preview
2. **📄 PDF-Export** für Dokumente
3. **📎 Dateianhänge** mit Drag & Drop
4. **🌙 Dark Mode** mit System-Präferenz
5. **⌨️ Keyboard Shortcuts** für Power-User

---

## 📦 Installation

### 1. Dependencies installieren

```bash
cd frontend
npm install
```

### 2. Dev-Server starten

```bash
npm run dev
```

---

## 🎯 Features im Detail

### 1. Markdown-Editor

**Komponente:** `MarkdownEditor.tsx`

**Verwendung:**
```tsx
import { MarkdownEditor } from './components/MarkdownEditor';

<MarkdownEditor
  value={content}
  onChange={setContent}
  height={400}
/>
```

**Features:**
- Live-Preview (Split-Screen)
- Syntax-Highlighting
- Toolbar mit Formatierungsoptionen
- Markdown Cheatsheet Link

---

### 2. PDF-Export

**Utility:** `utils/pdfExport.ts`

**Verwendung:**
```tsx
import { exportDocumentToPDF } from './utils/pdfExport';
import { showToast } from './utils/toast';

const handleExport = async () => {
  try {
    await exportDocumentToPDF(document);
    showToast.success('PDF wurde erfolgreich exportiert!');
  } catch (error) {
    showToast.error('Fehler beim PDF-Export');
  }
};
```

**Features:**
- Export einzelner Dokumente
- Automatische Formatierung
- Mehrseitige PDFs
- Metadaten im PDF

---

### 3. Dateianhänge

**Komponente:** `FileUpload.tsx`

**Verwendung:**
```tsx
import { FileUpload } from './components/FileUpload';

<FileUpload
  onFilesSelected={(files) => handleFiles(files)}
  maxFiles={5}
  maxSize={10 * 1024 * 1024}
/>
```

**Features:**
- Drag & Drop
- Multi-File Upload
- Dateigröße-Validierung
- Unterstützte Formate: Bilder, PDFs, Docs, Text

---

### 4. Dark Mode

**Context:** `context/DarkModeContext.tsx`  
**Komponente:** `DarkModeToggle.tsx`

**Verwendung:**
```tsx
import { DarkModeToggle } from './components/DarkModeToggle';
import { useDarkMode } from './context/DarkModeContext';

// In Header/Navigation
<DarkModeToggle />

// Programmatisch
const { isDarkMode, toggleDarkMode } = useDarkMode();
```

**Features:**
- System-Präferenz erkennen
- LocalStorage Persistenz
- Smooth Transitions
- Tailwind Dark Classes

---

### 5. Keyboard Shortcuts

**Hook:** `hooks/useKeyboardShortcuts.ts`

**Verwendung:**
```tsx
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

useKeyboardShortcuts({
  onNewDocument: () => handleNewDocument(),
  onSearch: () => openSearch(),
  onToggleDarkMode: () => toggleDarkMode(),
  onEscape: () => closeModal(),
});
```

**Verfügbare Shortcuts:**
- `N` - Neues Dokument
- `Ctrl+K` / `Cmd+K` - Suche öffnen
- `Ctrl+D` / `Cmd+D` - Dark Mode toggle
- `ESC` - Modal schließen

---

## 🔧 Integration in bestehende Komponenten

### DocumentForm.tsx - Markdown Editor integrieren

Ersetze das `<textarea>` durch:

```tsx
import { MarkdownEditor } from './MarkdownEditor';

// In der Form:
<MarkdownEditor
  value={formData.content}
  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
  placeholder="Dokumenteninhalt eingeben..."
/>
```

### DocumentDetailPage.tsx - PDF Export Button hinzufügen

```tsx
import { exportDocumentToPDF } from '../utils/pdfExport';
import { showToast } from '../utils/toast';

// Export Button:
<button
  onClick={async () => {
    try {
      await exportDocumentToPDF(document);
      showToast.success('PDF erfolgreich exportiert!');
    } catch (error) {
      showToast.error('Fehler beim Export');
    }
  }}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
>
  📄 Als PDF exportieren
</button>
```

### HomePage.tsx - Dark Mode Toggle hinzufügen

```tsx
import { DarkModeToggle } from '../components/DarkModeToggle';

// Im Header:
<div className="flex items-center gap-3">
  <DarkModeToggle />
  <Link to="/dashboard">Dashboard</Link>
</div>
```

### DocumentList.tsx - Keyboard Shortcuts hinzufügen

```tsx
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDarkMode } from '../context/DarkModeContext';

// Im Component:
const { toggleDarkMode } = useDarkMode();

useKeyboardShortcuts({
  onNewDocument: () => setIsFormOpen(true),
  onSearch: () => document.querySelector('input[type="text"]')?.focus(),
  onToggleDarkMode: toggleDarkMode,
  onEscape: () => setIsFormOpen(false),
});
```

---

## 📋 Nächste Schritte

Nach der Installation kannst du:

1. **Markdown Editor testen**: Öffne "Neues Dokument" und probiere die Formatierung
2. **PDF Export testen**: Exportiere ein Dokument als PDF
3. **Dark Mode aktivieren**: Klicke auf den Dark Mode Button (oder drücke `Ctrl+D`)
4. **Keyboard Shortcuts ausprobieren**: Drücke `N` für neues Dokument
5. **Datei-Upload vorbereiten**: Integriere FileUpload in DocumentForm

---

## 🐛 Troubleshooting

### Fehler beim npm install?
```bash
# Cache leeren
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Dark Mode funktioniert nicht?
- Stelle sicher, dass `DarkModeProvider` in `main.tsx` eingebunden ist
- Prüfe ob Tailwind Config `darkMode: 'class'` hat

### Keyboard Shortcuts funktionieren nicht?
- Prüfe ob `react-hotkeys-hook` installiert ist
- Stelle sicher, dass keine anderen Event-Listener die Shortcuts blockieren

---

## 📚 Weitere Features (optional)

Wenn du noch mehr willst, kann ich implementieren:
- Versionierung mit History
- Erweiterte Suche mit Highlighting
- Templates System
- User Authentication
- Kommentare & Collaboration

Sag einfach Bescheid! 🚀
