"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const localScanner_1 = require("./services/localScanner");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const scanner = new localScanner_1.LocalScanner();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'IT-Dokumentation API',
        version: '1.0.0',
        endpoints: [
            'GET /api/health - Health Check',
            'GET /api/docs - API Documentation',
            'POST /api/scan - Scan local directory for IT assets'
        ]
    });
});
// Local Scanner Endpoint
app.post('/api/scan', async (req, res) => {
    try {
        const { path, maxDepth = 3, includeExtensions, excludePatterns, includeStatistics = true } = req.body;
        if (!path) {
            return res.status(400).json({
                error: 'Path is required',
                message: 'Bitte gib einen Pfad zum Scannen an (z.B. C:\\Users\\...)',
            });
        }
        console.log(`Scanning directory: ${path}`);
        // Führe Scan durch
        const results = await scanner.scanDirectory(path, {
            maxDepth,
            includeExtensions,
            excludePatterns,
        });
        // Generiere Statistiken
        const statistics = includeStatistics ? scanner.generateStatistics(results) : null;
        res.json({
            success: true,
            path,
            scannedAt: new Date().toISOString(),
            results,
            statistics,
        });
    }
    catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({
            error: 'Scan failed',
            message: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api/docs`);
});
//# sourceMappingURL=index.js.map