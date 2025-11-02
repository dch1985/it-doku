/**
 * API Helper Functions
 * Centralized API URL handling and helpers
 */

/**
 * Get API URL (handles both with and without /api)
 */
export function getApiUrl(): string {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
}

/**
 * Build headers with tenant information
 */
export function buildHeaders(tenantId?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  return headers;
}

