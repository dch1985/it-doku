"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LocalScanner {
    constructor() {
        this.IT_EXTENSIONS = [
            // Konfigurationsdateien
            '.conf', '.config', '.cfg', '.ini', '.yaml', '.yml', '.json', '.xml',
            // Dokumentation
            '.md', '.txt', '.doc', '.docx', '.pdf',
            // Scripts
            '.sh', '.bat', '.ps1', '.cmd',
            // Code
            '.js', '.ts', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rb',
            // Logs
            '.log',
            // Datenbanken
            '.sql', '.db', '.sqlite',
            // Docker/Container
            'Dockerfile', '.dockerignore', 'docker-compose.yml',
            // Infrastructure as Code
            '.tf', '.tfvars',
        ];
        this.EXCLUDE_PATTERNS = [
            'node_modules',
            '.git',
            '.vscode',
            '.idea',
            'dist',
            'build',
            'target',
            '__pycache__',
            '.next',
            'coverage',
        ];
    }
    /**
     * Scannt ein lokales Verzeichnis und gibt IT-relevante Dateien zurück
     * @param targetPath - Windows- oder Unix-Pfad zum Scannen (z.B. C:\Users\... oder /home/...)
     * @param options - Scan-Optionen
     */
    async scanDirectory(targetPath, options = {}) {
        const { maxDepth = 5, includeExtensions = this.IT_EXTENSIONS, excludePatterns = this.EXCLUDE_PATTERNS, followSymlinks = false, } = options;
        const results = [];
        // Normalisiere den Pfad für Windows und Unix
        const normalizedPath = path.normalize(targetPath);
        try {
            // Prüfe ob Pfad existiert
            if (!fs.existsSync(normalizedPath)) {
                throw new Error(`Pfad existiert nicht: ${normalizedPath}`);
            }
            // Starte rekursiven Scan
            await this.scanRecursive(normalizedPath, results, 0, maxDepth, includeExtensions, excludePatterns, followSymlinks);
            return results;
        }
        catch (error) {
            throw new Error(`Fehler beim Scannen: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async scanRecursive(currentPath, results, currentDepth, maxDepth, includeExtensions, excludePatterns, followSymlinks) {
        // Maximale Tiefe erreicht
        if (currentDepth > maxDepth) {
            return;
        }
        try {
            const stats = fs.statSync(currentPath, { throwIfNoEntry: false });
            if (!stats) {
                return;
            }
            // Prüfe ob es ein Symlink ist
            if (stats.isSymbolicLink() && !followSymlinks) {
                return;
            }
            const basename = path.basename(currentPath);
            // Prüfe Exclude-Patterns
            if (this.shouldExclude(basename, excludePatterns)) {
                return;
            }
            if (stats.isDirectory()) {
                // Füge Verzeichnis hinzu
                results.push({
                    path: currentPath,
                    name: basename,
                    type: 'directory',
                    lastModified: stats.mtime,
                });
                // Lese Verzeichnis-Inhalte
                const entries = fs.readdirSync(currentPath);
                // Scanne jedes Element
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry);
                    await this.scanRecursive(fullPath, results, currentDepth + 1, maxDepth, includeExtensions, excludePatterns, followSymlinks);
                }
            }
            else if (stats.isFile()) {
                const extension = path.extname(currentPath);
                // Prüfe ob Datei relevant ist
                if (this.isRelevantFile(currentPath, extension, includeExtensions)) {
                    results.push({
                        path: currentPath,
                        name: basename,
                        type: 'file',
                        size: stats.size,
                        extension,
                        category: this.categorizeFile(extension, basename),
                        lastModified: stats.mtime,
                    });
                }
            }
        }
        catch (error) {
            // Fehler beim Zugriff auf Datei/Verzeichnis (z.B. Berechtigungen)
            // Ignorieren und fortfahren
            console.warn(`Konnte nicht auf ${currentPath} zugreifen:`, error);
        }
    }
    shouldExclude(name, excludePatterns) {
        return excludePatterns.some((pattern) => name.toLowerCase().includes(pattern.toLowerCase()));
    }
    isRelevantFile(filePath, extension, includeExtensions) {
        const basename = path.basename(filePath);
        // Spezielle Dateien ohne Extension
        const specialFiles = [
            'Dockerfile',
            'Makefile',
            'README',
            'LICENSE',
            '.dockerignore',
            '.gitignore',
        ];
        if (specialFiles.some((special) => basename.toLowerCase().includes(special.toLowerCase()))) {
            return true;
        }
        // Prüfe Extension
        return includeExtensions.some((ext) => extension.toLowerCase() === ext.toLowerCase());
    }
    categorizeFile(extension, filename) {
        const ext = extension.toLowerCase();
        const name = filename.toLowerCase();
        // Konfiguration
        if (['.conf', '.config', '.cfg', '.ini', '.yaml', '.yml', '.json', '.xml'].includes(ext)) {
            return 'configuration';
        }
        // Dokumentation
        if (['.md', '.txt', '.doc', '.docx', '.pdf'].includes(ext)) {
            return 'documentation';
        }
        // Scripts
        if (['.sh', '.bat', '.ps1', '.cmd'].includes(ext)) {
            return 'script';
        }
        // Source Code
        if (['.js', '.ts', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rb'].includes(ext)) {
            return 'source-code';
        }
        // Logs
        if (ext === '.log' || name.includes('log')) {
            return 'log';
        }
        // Datenbank
        if (['.sql', '.db', '.sqlite'].includes(ext)) {
            return 'database';
        }
        // Docker
        if (name.includes('docker')) {
            return 'container';
        }
        // Infrastructure as Code
        if (['.tf', '.tfvars'].includes(ext)) {
            return 'infrastructure';
        }
        return 'other';
    }
    /**
     * Generiert einen Statistik-Überblick über die Scan-Ergebnisse
     */
    generateStatistics(results) {
        const stats = {
            totalFiles: results.filter((r) => r.type === 'file').length,
            totalDirectories: results.filter((r) => r.type === 'directory').length,
            totalSize: results
                .filter((r) => r.type === 'file')
                .reduce((sum, r) => sum + (r.size || 0), 0),
            categories: {},
            extensions: {},
        };
        // Zähle Kategorien
        results
            .filter((r) => r.type === 'file')
            .forEach((r) => {
            if (r.category) {
                stats.categories[r.category] = (stats.categories[r.category] || 0) + 1;
            }
            if (r.extension) {
                stats.extensions[r.extension] = (stats.extensions[r.extension] || 0) + 1;
            }
        });
        return stats;
    }
}
exports.LocalScanner = LocalScanner;
//# sourceMappingURL=localScanner.js.map