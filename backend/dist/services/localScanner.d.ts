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
export declare class LocalScanner {
    private readonly IT_EXTENSIONS;
    private readonly EXCLUDE_PATTERNS;
    /**
     * Scannt ein lokales Verzeichnis und gibt IT-relevante Dateien zurück
     * @param targetPath - Windows- oder Unix-Pfad zum Scannen (z.B. C:\Users\... oder /home/...)
     * @param options - Scan-Optionen
     */
    scanDirectory(targetPath: string, options?: ScanOptions): Promise<ScanResult[]>;
    private scanRecursive;
    private shouldExclude;
    private isRelevantFile;
    private categorizeFile;
    /**
     * Generiert einen Statistik-Überblick über die Scan-Ergebnisse
     */
    generateStatistics(results: ScanResult[]): any;
}
//# sourceMappingURL=localScanner.d.ts.map