# ✅ Vercel Setup Checklist für TrustDoc

## Aktueller Status
✅ **Code:** Build erfolgreich lokal getestet (334KB bundle)  
❌ **Vercel:** Build Settings müssen angepasst werden

## Vercel Dashboard Settings

### Schritt 1: Öffne Project Settings
1. Gehe zu: https://vercel.com/chaouat-consulting/my-trustdoc-1985/settings
2. Klicke auf "Settings" Tab

### Schritt 2: General Settings
**Root Directory:** 
```
frontend
```
*(Vercel baut dann alles im frontend/ Ordner)*

### Schritt 3: Build & Development Settings
**Überschreibe:** ON (✅)

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Development Command:**
```
npm run dev
```

**Install Command:**
```
npm install
```

### Schritt 4: Framework Preset
**Framework Preset:** 
```
Vite
```
oder
```
Other
```

### Schritt 5: Environment Variables (Optional)
Falls du Backend API einbindest:
- `VITE_API_URL`: `https://your-backend-api.vercel.app/api`
- `VITE_DEV_AUTH_ENABLED`: `false` (Production)

### Schritt 6: Save & Redeploy
1. Klicke "Save"
2. Gehe zu "Deployments" Tab
3. Klicke auf "..." (drei Punkte) beim neuesten Deployment
4. Klicke "Redeploy"

## Nach erfolgreichem Deploy

✅ **Production URL:**
```
https://my-trustdoc-1985-git-main-chaouat-consulting.vercel.app
```

✅ **Preview URLs:**
```
Automatisch bei jedem Pull Request
```

## Troubleshooting

### "Build Failed" - Command exited with 2
**Problem:** TypeScript Errors  
**Lösung:** 
- Root Directory auf `frontend` setzen
- Build Command: `npm run build` (ohne `tsc -b`)

### "Cannot find module" Errors
**Problem:** Missing dependencies  
**Lösung:** 
- `@radix-ui/react-scroll-area` ist schon im package.json ✅
- Alle Dependencies werden mit `npm install` installiert

### "404 Not Found" nach Deploy
**Problem:** Output Directory falsch  
**Lösung:** 
- Output Directory: `dist` (nicht `frontend/dist` wenn Root Directory = frontend)

## Quick Test

Nach Settings-Änderung sollte das Log so aussehen:

```
Running "cd frontend && npm run build"
> @it-doku/frontend@0.0.0 build
> vite build

vite v7.1.12 building for production...
✓ built in 17.83s
```

## ✅ Erfolgreich wenn:

1. ✅ Build successful in ~20-30s
2. ✅ Keine TypeScript Errors
3. ✅ Landing Page lädt im Browser
4. ✅ TrustDoc Logo sichtbar
5. ✅ Hero Text: "Document with confidence. Operate with proof."

---

**Noch Probleme?** Öffne ein Issue im GitHub Repo!

