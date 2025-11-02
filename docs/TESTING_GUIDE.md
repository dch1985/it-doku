# 🧪 Testing Guide - IT-Doku

**Quick Start für erfolgreiches Testen**

---

## 🚀 Schritt-für-Schritt Test-Guide

### **Phase 1: Setup & Vorbereitung** (5 Min)

#### 1.1 Backend starten
```bash
cd backend
npm run dev
```

**Erwartete Ausgabe:**
```
⚠️  Development Auth Mode ENABLED
Backend server running on http://localhost:3002
```

#### 1.2 Frontend starten
```bash
cd frontend
npm run dev
```

**Erwartete Ausgabe:**
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

#### 1.3 Browser öffnen
```
http://localhost:5173
```

#### 1.4 Prüfe Konsolen
**Browser Console sollte zeigen:**
- Keine Errors
- Optional: `[Dev Auth] Database unavailable, using mock user` (OK wenn Firewall nicht aktiv)

---

### **Phase 2: Funktionalitätstests** (15 Min)

#### 2.1 Authentication & Design ✅
**Geschätzte Zeit:** 2 Min

1. Klicke auf **"Log In"** in Sidebar
2. ✅ Automatischer Login als "DU Demo User"
3. ✅ Sidebar zeigt deinen Namen
4. Klicke auf **🌙** Icon im Header
5. ✅ Theme wechselt von Dark zu Light

**Erfolg wenn:**
- ✅ Login funktioniert ohne Fehler
- ✅ Theme-Toggle funktioniert
- ✅ Hut 8 Design sichtbar (minimalistisch, elegant)

---

#### 2.2 Global Search ✅
**Geschätzte Zeit:** 3 Min

**Ohne DB (kann jetzt getestet werden):**

1. Drücke **CTRL+K** (Windows) oder **CMD+K** (Mac)
2. ✅ Command Dialog öffnet sich
3. Teste Navigation:
   - Gib `dashboard` ein
   - Klicke auf "Dashboard" Result
   - ✅ Navigiert zu Dashboard
4. Teste Page Navigation:
   - Drücke wieder CTRL+K
   - Klicke auf andere Pages (Settings, Analytics, etc.)
   - ✅ Alle Pages sind klickbar

**Mit DB (nach Firewall):**

5. Gib `server` ein (wenn Daten existieren)
6. ✅ Sucht in allen Entitäten:
   - Documents mit "server"
   - Assets mit "server"
   - Network Devices mit "server"
   - Passwords, Contracts mit "server"
7. ✅ Results gruppiert nach Typ
8. Klicke auf ein Result
9. ✅ Navigiert zum Detail-View

---

#### 2.3 Export Functions ✅
**Geschätzte Zeit:** 3 Min

**HINWEIS:** Da die DB noch nicht verfügbar ist, können wir dies nur im Frontend testen. Vollständiger Test nach Firewall.

1. Gehe zur Documentation-Seite
2. Wenn keine Docs vorhanden (wegen Firewall):
   - ✅ UI zeigt "No documents found"
   - ✅ "+ New Document" Button ist sichtbar

**Alternativer Test (mit Mock-Data):**
1. Backend-Tests werden später ausgeführt
2. Export-Funktionen können im Frontend-UI getestet werden

---

#### 2.4 Responsive Design ✅
**Geschätzte Zeit:** 5 Min

1. Öffne Browser DevTools (F12)
2. Setze Viewport auf **375px** (Mobile)
   - ✅ Sidebar versteckt sich
   - ✅ Hamburger-Menu (☰) sichtbar
   - ✅ Klick auf Menu öffnet Sidebar
   - ✅ Cards stack in 1 Column
3. Setze Viewport auf **768px** (Tablet)
   - ✅ Sidebar versteckt sich
   - ✅ Cards stack in 2 Columns
4. Setze Viewport auf **1920px** (Desktop)
   - ✅ Sidebar immer sichtbar
   - ✅ Cards in 3 Columns
5. Prüfe Touch-Targets (Mobile):
   - ✅ Buttons mind. 44x44px
   - ✅ Keine hover-only Features

---

#### 2.5 Navigation & UX ✅
**Geschätzte Zeit:** 2 Min

1. Klicke durch alle Sidebar-Items:
   - Dashboard
   - Documentation
   - Passwords
   - Assets
   - Contracts
   - Network Devices
   - Customer Portals
   - Process Recordings
   - AI Chat
   - Analytics
   - Settings

**Erfolg wenn:**
- ✅ Alle Links funktionieren
- ✅ Keine 404 Errors
- ✅ URL ändert sich (`hash`-based routing)
- ✅ Loading-States sichtbar wenn API-Calls

---

### **Phase 3: Datenbank-abhängige Tests** ⏳
**NACH FIREWALL-ANPASSUNG**

#### 3.1 Documents Management
**Test bei Firewall aktiv:**

1. **Dokument erstellen:**
   - Gehe zu Documentation
   - Klicke "+ New Document"
   - Wähle Category: SERVER
   - ✅ Dokument wird mit Standard-Template erstellt
   - Füge Text hinzu
   - ✅ Save funktioniert
   - ✅ Dokument erscheint in Liste

2. **Dokument bearbeiten:**
   - Klicke auf Dokument
   - Klicke "Edit"
   - Nutze Editor-Toolbar
   - ✅ Formatierung funktioniert
   - Klicke "Save"
   - ✅ Änderungen werden gespeichert

3. **Version History:**
   - Wechsle zu "History" Tab
   - ✅ Alle Änderungen werden gelistet
   - ✅ Versions-Nummern sichtbar
   - ✅ User-Namen sichtbar

4. **Comments:**
   - Wechsle zu "Comments" Tab
   - Füge Kommentar hinzu
   - ✅ Kommentar wird erstellt
   - ✅ Andere Kommentare sind sichtbar

5. **Export:**
   - Klicke "Export" → "PDF"
   - ✅ PDF wird heruntergeladen
   - Wiederhole für Word, Markdown, JSON

---

#### 3.2 Templates System
**Test bei Firewall aktiv:**

1. Gehe zu Documentation
2. Klicke "Templates" Tab
3. Klicke auf ein Template (z.B. ISO 27001, NIST, etc.)
4. ✅ Template-Formular öffnet sich
5. Fülle Variablen aus
6. Klicke "Speichern"
7. ✅ Dokument wird mit Template-Content erstellt

---

#### 3.3 Passwords Management
**Test bei Firewall aktiv:**

1. **Password erstellen:**
   - Gehe zu Passwords
   - Klicke "+ New Password"
   - Fülle aus:
     - Name: Admin
     - Username: admin
     - Password: Secure123!
   - Klicke "Save"
   - ✅ Password wird erstellt

2. **Password anzeigen:**
   - Klicke "Eye"-Icon
   - ✅ Password wird entschlüsselt angezeigt
   - ✅ Audit-Log wird erstellt

3. **Asset-Verknüpfung:**
   - Erstelle Asset zuerst
   - Erstelle Password mit Asset-Verknüpfung
   - ✅ Asset wird in Password-Liste angezeigt

---

#### 3.4 Assets Management
**Test bei Firewall aktiv:**

1. **Asset erstellen:**
   - Gehe zu Assets
   - Klicke "+ New Asset"
   - Fülle aus:
     - Name: Server-01
     - Type: SERVER
     - IP Address: 192.168.1.100
   - Klicke "Save"
   - ✅ Asset wird erstellt

2. **Verknüpfungen:**
   - Erstelle Contract mit Asset-Verknüpfung
   - ✅ Asset zeigt Contract-Count
   - Erstelle Password mit Asset-Verknüpfung
   - ✅ Asset zeigt Password-Count

---

#### 3.5 Contracts Management
**Test bei Firewall aktiv:**

1. **Contract erstellen:**
   - Gehe zu Contracts
   - Klicke "+ New Contract"
   - Fülle aus:
     - Name: Office 365
     - Type: SOFTWARE
     - Vendor: Microsoft
     - Start Date: Heute
     - End Date: +1 Jahr
   - Klicke "Save"
   - ✅ Contract wird erstellt

2. **Renewal:**
   - Klicke "Renew" Button
   - ✅ Contract wird um 1 Jahr verlängert
   - ✅ End Date wird aktualisiert

---

#### 3.6 Network Devices
**Test bei Firewall aktiv:**

1. **Device erstellen:**
   - Gehe zu Network Devices
   - Klicke "+ New Device"
   - Fülle aus:
     - Name: Switch-01
     - IP Address: 192.168.1.254
     - Device Type: SWITCH
     - Manufacturer: Cisco
   - Klicke "Save"
   - ✅ Device wird erstellt

2. **Ping-Funktion:**
   - Klicke "Ping" Icon
   - ✅ Simuliert Reachability
   - ✅ Status-Updates

3. **Asset-Verknüpfung:**
   - Verknüpfe Device mit Asset
   - ✅ Asset-Link wird angezeigt

---

#### 3.7 Customer Portals
**Test bei Firewall aktiv:**

1. **Portal erstellen:**
   - Gehe zu Customer Portals
   - Klicke "+ New Portal"
   - Fülle aus:
     - Name: Customer XYZ
   - Klicke "Save"
   - ✅ Portal wird erstellt
   - ✅ Slug wird generiert: `customer-xyz`
   - ✅ Public Key wird generiert

2. **Settings:**
   - Klicke "Edit"
   - Ändere Settings (JSON)
   - ✅ Settings werden gespeichert

---

#### 3.8 Process Recordings
**Test bei Firewall aktiv:**

1. **Recording erstellen:**
   - Gehe zu Process Recordings
   - Klicke "+ New Recording"
   - Fülle aus:
     - Title: Backup Procedure
     - Process Type: BACKUP
   - Klicke "Save"
   - ✅ Recording wird erstellt

2. **Steps hinzufügen:**
   - Klicke "Edit"
   - Füge Steps als JSON hinzu
   - ✅ Steps werden gespeichert

---

#### 3.9 Analytics & Dashboard
**Test bei Firewall aktiv:**

1. Gehe zu Dashboard
2. Prüfe Statistics Cards:
   - ✅ Total Documents: Echte Zahl
   - ✅ Active Users: Echte Zahl
   - ✅ Templates: Anzahl Templates
   - ✅ Growth Rate: Berechnet

3. Prüfe Charts:
   - ✅ Documents Growth Chart: Historie
   - ✅ Storage Chart: Dummy-Daten

4. Prüfe Recent Activity:
   - ✅ Zeigt letzte Documents
   - ✅ Klick navigiert zu Doc

---

### **Phase 4: Edge Cases & Fehlerbehandlung** (10 Min)

#### 4.1 Fehler-Tests

1. **Ohne Tenant:**
   - Lösche Tenant-Auswahl
   - Versuche Dokument zu erstellen
   - ✅ Error-Message wird angezeigt
   - ✅ User wird aufgefordert Tenant zu wählen

2. **Validierung:**
   - Erstelle Dokument ohne Titel
   - ✅ Validierungs-Fehler wird angezeigt
   - ✅ Document wird nicht erstellt

3. **Network-Errors:**
   - Stoppe Backend (Ctrl+C)
   - Versuche Action auszuführen
   - ✅ Error-Toast wird angezeigt
   - ✅ UI bleibt stabil

4. **Graceful Degradation:**
   - Ohne DB läuft App weiter
   - ✅ Mock-User wird verwendet
   - ✅ Leere Listen werden angezeigt

---

#### 4.2 Security Tests

1. **Tenant Isolation:**
   - Erstelle als User 1 ein Dokument in Tenant A
   - Logge dich als User 2 ein
   - Gehe zu Tenant B
   - ✅ Dokument von User 1 ist NICHT sichtbar

2. **Password Encryption:**
   - Erstelle Passwort: `Test123`
   - Prüfe Datenbank direkt
   - ✅ Passwort ist NICHT im Klartext
   - ✅ Passwort ist verschlüsselt

3. **Audit Logging:**
   - Führe Aktionen aus
   - Prüfe Backend-Logs
   - ✅ Jede Aktion wird geloggt
   - ✅ IP-Adresse wird erfasst
   - ✅ User-Agent wird erfasst

---

### **Phase 5: Performance Tests** (5 Min)

#### 5.1 Load Time

1. Öffne Browser DevTools
2. Gehe zu Network Tab
3. Reload Page (F5)
4. Prüfe Load Time:
   - ✅ Initial Load < 2s
   - ✅ API Calls < 500ms
   - ✅ Keine ungenutzten Requests

#### 5.2 Search Performance

1. Erstelle 50+ Test-Dokumente (via Backend oder UI)
2. Drücke CTRL+K
3. Gib `test` ein
4. Prüfe:
   - ✅ Search-Delay: 300ms (Debounce)
   - ✅ Results erscheinen < 1s
   - ✅ Keine UI-Freeze

---

## 📊 Quick Test Checklist

### **Kann JETZT getestet werden** (ohne DB):
- [x] Login (Mock-User)
- [x] Design & Theme Toggle
- [x] Navigation (alle Seiten)
- [x] Responsive Design (Mobile, Tablet, Desktop)
- [x] Global Search UI (CTRL+K)
- [x] Command Palette
- [x] Page-Navigation via Search

### **Nach Firewall-Aktivierung** (mit DB):
- [ ] Tenant-Management
- [ ] Documents CRUD
- [ ] Templates System
- [ ] Passwords CRUD + Encryption
- [ ] Assets CRUD
- [ ] Contracts CRUD
- [ ] Network Devices CRUD
- [ ] Customer Portals CRUD
- [ ] Process Recordings CRUD
- [ ] Version History
- [ ] Comments System
- [ ] Export Functions (PDF, Word, etc.)
- [ ] Analytics Dashboard
- [ ] Audit System
- [ ] Notifications (Backend funktioniert, UI fehlt noch)

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch..."
**Lösung:**
1. Prüfe ob Backend läuft: `http://localhost:3002/api/health`
2. Prüfe CORS in Backend-Logs
3. Prüfe `.env` Dateien

### Problem: "Firewall Error"
**Lösung:**
- Azure Portal → SQL Server → Networking
- Füge IP hinzu
- Warte 5 Minuten

### Problem: "Mock User verwendet"
**Lösung:**
- Das ist OK! Mock-User ist Feature im Dev-Mode
- Nach Firewall-Aktivierung werden echte Users verwendet

---

**Erstellt:** 02.11.2025  
**Status:** Ready for Testing
