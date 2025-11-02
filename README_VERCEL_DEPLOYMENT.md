# 🚀 Vercel Deployment Guide für TrustDoc

## Schritt 1: Vercel Account erstellen

1. Gehe zu https://vercel.com/signup
2. Melde dich mit GitHub an (empfohlen)
3. Bestätige Email

## Schritt 2: Vercel Projekt erstellen

1. Auf https://vercel.com/dashboard
2. Klicke "Add New Project"
3. Wähle dein GitHub Repository: `it-doku`
4. Klicke "Import"

## Schritt 3: Project Settings konfigurieren

**Root Directory:** `frontend`

**Build Settings:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:** (Optional)
- `VITE_API_URL`: `http://localhost:3001/api` (für Development)
- `VITE_DEV_AUTH_ENABLED`: `true` (für Testing)

## Schritt 4: Deploy klicken! 🎉

Vercel baut automatisch und deployed deine TrustDoc Landing Page!

## Schritt 5: GitHub Secrets für automatisches Deployment

**Optional:** Für automatisches Deployment bei jedem Git Push:

1. Gehe zu Vercel Dashboard → Settings → Tokens
2. Erstelle einen neuen Token: "GITHUB_DEPLOYMENT"
3. Kopiere den Token

4. Gehe zu GitHub: https://github.com/dch1985/it-doku/settings/secrets/actions
5. Klicke "New repository secret"
6. Name: `VERCEL_TOKEN`
7. Value: Den Token von Vercel einfügen
8. Klicke "Add secret"

## Ergebnis

Nach dem ersten Deployment bekommst du:

```
🌐 Production URL: https://it-doku.vercel.app
🔄 Auto-Deployments bei jedem Push zu main
📊 Analytics & Insights
🚀 Preview URLs für jede PR
```

## Lokales Testen

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy Preview
cd frontend
vercel
```

## Troubleshooting

### Build fehlt?
- Prüfe "Root Directory" ist `frontend`
- Prüfe "Output Directory" ist `dist`

### 404 Errors?
- Prüfe `rewrites` in `vercel.json`
- Alle Routes sollten zu `/index.html` führen

### Environment Variables fehlen?
- In Vercel Dashboard: Settings → Environment Variables
- Füge `VITE_*` Variablen hinzu

## Nächste Schritte

1. ✅ **Custom Domain:** Füge deine Domain hinzu (z.B. trustdoc.com)
2. ✅ **Analytics:** Aktiviere Vercel Analytics
3. ✅ **Performance:** Prüfe Lighthouse Scores
4. ✅ **Preview Deploys:** Teste jede PR automatisch

---

**Fragen?** Öffne ein Issue auf GitHub oder kontaktiere das Team!

