# ============================================
# IT-DOKU FOUNDATION - INSTALLATION SCRIPT
# ============================================
# Dieses Script kopiert alle Foundation-Dateien in dein Projekt
# Ausführen in PowerShell als Administrator

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\DrissChaouat\Code\it-doku"
$frontendPath = "$projectRoot\frontend-new"
$backendPath = "$projectRoot\backend"

Write-Host "🚀 Starting Foundation Installation..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# FRONTEND SETUP
# ============================================
Write-Host "📦 Setting up Frontend..." -ForegroundColor Yellow

# Navigate to frontend
Set-Location $frontendPath

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install zustand immer
npm install -D @types/node vite-plugin-bundle-analyzer
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Gray
$directories = @(
    "src\stores",
    "src\hooks",
    "src\components\ui",
    "src\test",
    "src\utils"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force -ErrorAction SilentlyContinue | Out-Null
}

Write-Host "✅ Frontend structure created!" -ForegroundColor Green
Write-Host ""

# ============================================
# BACKEND SETUP
# ============================================
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow

# Navigate to backend
Set-Location $backendPath

# Backup existing schema
if (Test-Path "prisma\schema.prisma") {
    Write-Host "Backing up existing schema..." -ForegroundColor Gray
    Copy-Item "prisma\schema.prisma" "prisma\schema.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').prisma"
}

Write-Host "✅ Backend ready for schema update!" -ForegroundColor Green
Write-Host ""

# ============================================
# FILE LOCATIONS
# ============================================
Write-Host "📁 File Structure:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend (frontend-new/):" -ForegroundColor Yellow
Write-Host "  src/stores/" -ForegroundColor Gray
Write-Host "    ├── useAppStore.ts          → Global App State" -ForegroundColor White
Write-Host "    ├── useDocumentStore.ts     → Document Management" -ForegroundColor White
Write-Host "    ├── useConversationStore.ts → AI Chat State" -ForegroundColor White
Write-Host "    └── index.ts                → Exports" -ForegroundColor White
Write-Host ""
Write-Host "  src/hooks/" -ForegroundColor Gray
Write-Host "    └── useApi.ts               → API Client + Retry Logic" -ForegroundColor White
Write-Host ""
Write-Host "  src/components/" -ForegroundColor Gray
Write-Host "    ├── ErrorBoundary.tsx       → Error Handling" -ForegroundColor White
Write-Host "    ├── Toast.tsx               → Notifications" -ForegroundColor White
Write-Host "    └── Loading.tsx             → Skeletons & Spinners" -ForegroundColor White
Write-Host ""
Write-Host "  src/test/" -ForegroundColor Gray
Write-Host "    └── setup.ts                → Test Configuration" -ForegroundColor White
Write-Host ""

Write-Host "Backend (backend/):" -ForegroundColor Yellow
Write-Host "  prisma/" -ForegroundColor Gray
Write-Host "    └── schema.prisma           → Extended Database Schema" -ForegroundColor White
Write-Host ""

# ============================================
# NEXT STEPS
# ============================================
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy Foundation files from Claude's output to your project" -ForegroundColor White
Write-Host "2. Update prisma/schema.prisma with new schema" -ForegroundColor White
Write-Host "3. Run: npx prisma migrate dev --name foundation_v2" -ForegroundColor White
Write-Host "4. Update vite.config.ts with bundle analyzer config" -ForegroundColor White
Write-Host "5. Create vitest.config.ts for testing" -ForegroundColor White
Write-Host "6. Integrate ErrorBoundary & ToastContainer in App.tsx" -ForegroundColor White
Write-Host "7. Run: npm run build (check bundle size)" -ForegroundColor White
Write-Host "8. Run: npm test (verify tests work)" -ForegroundColor White
Write-Host ""

# ============================================
# VERIFICATION
# ============================================
Write-Host "✅ VERIFICATION COMMANDS:" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend checks:" -ForegroundColor Yellow
Write-Host "  cd $frontendPath" -ForegroundColor Gray
Write-Host "  npm run build          # Should complete without errors" -ForegroundColor Gray
Write-Host "  npm test               # Should run tests" -ForegroundColor Gray
Write-Host "  npm run dev            # Should start dev server" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend checks:" -ForegroundColor Yellow
Write-Host "  cd $backendPath" -ForegroundColor Gray
Write-Host "  npx prisma generate    # Generate Prisma Client" -ForegroundColor Gray
Write-Host "  npx prisma studio      # Open database viewer" -ForegroundColor Gray
Write-Host "  npm run dev            # Should start backend" -ForegroundColor Gray
Write-Host ""

# ============================================
# FINISH
# ============================================
Write-Host "🎉 Foundation Setup Complete!" -ForegroundColor Green
Write-Host "📖 See FOUNDATION_WEEK1_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to build something amazing! 🚀" -ForegroundColor Magenta
