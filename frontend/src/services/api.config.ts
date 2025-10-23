/**
 * API Configuration
 * Zentrale Konfiguration für Backend-API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  
  ENDPOINTS: {
    // Health Check
    HEALTH: '/health',
    
    // Documents
    DOCUMENTS: '/api/documents',
    DOCUMENT_BY_ID: (id: string) => `/api/documents/${id}`,
    DOCUMENT_STATS: '/api/documents/stats',
    
    // Future endpoints
    CATEGORIES: '/api/categories',
    TAGS: '/api/tags',
    SEARCH: '/api/search',
  },
  
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
  SERVER_ERROR: 'Serverfehler. Bitte versuchen Sie es später erneut.',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden.',
  UNAUTHORIZED: 'Sie sind nicht autorisiert, diese Aktion auszuführen.',
  VALIDATION_ERROR: 'Validierungsfehler. Bitte überprüfen Sie Ihre Eingaben.',
  TIMEOUT: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
} as const;
