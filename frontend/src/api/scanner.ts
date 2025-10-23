const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ScanResult {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  category?: string;
  lastModified?: string;
}

export interface ScanStatistics {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  categories: Record<string, number>;
  extensions: Record<string, number>;
}

export interface ScanResponse {
  success: boolean;
  path: string;
  scannedAt: string;
  results: ScanResult[];
  statistics?: ScanStatistics;
}

export interface ScanOptions {
  path: string;
  maxDepth?: number;
  includeExtensions?: string[];
  excludePatterns?: string[];
  includeStatistics?: boolean;
}

export class ScannerAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async scanDirectory(options: ScanOptions): Promise<ScanResponse> {
    const response = await fetch(`${this.baseUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Scan fehlgeschlagen');
    }

    return response.json();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const scannerAPI = new ScannerAPI();
