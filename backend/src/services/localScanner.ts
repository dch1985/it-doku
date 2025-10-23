import * as fs from 'fs';
import * as path from 'path';

export interface ScanResult {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  category?: string;
  lastModified?: Date;
}

export interface ScanOptions {
  maxDepth?: number;
  includeExtensions?: string[];
  excludePatterns?: string[];
  followSymlinks?: boolean;
}

export class LocalScanner {
  private readonly IT_EXTENSIONS = [
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

  private readonly EXCLUDE_PATTERNS = [
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

  /**
   * Scannt ein lokales Verzeichnis und gibt IT-relevante Dateien zurück
   * @param targetPath - Windows- oder Unix-Pfad zum Scannen (z.B. C:\Users\... oder /home/...)
   * @param options - Scan-Optionen
   */
  async scanDirectory(
    targetPath: string,
    options: ScanOptions = {}
  ): Promise<ScanResult[]> {
    const {
      maxDepth = 5,
      includeExtensions = this.IT_EXTENSIONS,
      excludePatterns = this.EXCLUDE_PATTERNS,
      followSymlinks = false,
    } = options;

    const results: ScanResult[] = [];

    // Normalisiere den Pfad für Windows und Unix
    const normalizedPath = path.normalize(targetPath);

    try {
      // Prüfe ob Pfad existiert
      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Pfad existiert nicht: ${normalizedPath}`);
      }

      // Starte rekursiven Scan
      await this.scanRecursive(
        normalizedPath,
        results,
        0,
        maxDepth,
        includeExtensions,
        excludePatterns,
        followSymlinks
      );

      return results;
    } catch (error) {
      throw new Error(`Fehler beim Scannen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async scanRecursive(
    currentPath: string,
    results: ScanResult[],
    currentDepth: number,
    maxDepth: number,
    includeExtensions: string[],
    excludePatterns: string[],
    followSymlinks: boolean
  ): Promise<void> {
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
          await this.scanRecursive(
            fullPath,
            results,
            currentDepth + 1,
            maxDepth,
            includeExtensions,
            excludePatterns,
            followSymlinks
          );
        }
      } else if (stats.isFile()) {
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
    } catch (error) {
      // Fehler beim Zugriff auf Datei/Verzeichnis (z.B. Berechtigungen)
      // Ignorieren und fortfahren
      console.warn(`Konnte nicht auf ${currentPath} zugreifen:`, error);
    }
  }

  private shouldExclude(name: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isRelevantFile(
    filePath: string,
    extension: string,
    includeExtensions: string[]
  ): boolean {
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
    return includeExtensions.some((ext) =>
      extension.toLowerCase() === ext.toLowerCase()
    );
  }

  private categorizeFile(extension: string, filename: string): string {
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
  generateStatistics(results: ScanResult[]): any {
    const stats = {
      totalFiles: results.filter((r) => r.type === 'file').length,
      totalDirectories: results.filter((r) => r.type === 'directory').length,
      totalSize: results
        .filter((r) => r.type === 'file')
        .reduce((sum, r) => sum + (r.size || 0), 0),
      categories: {} as Record<string, number>,
      extensions: {} as Record<string, number>,
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
