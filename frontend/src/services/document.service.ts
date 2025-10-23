/**
 * Document Service
 * Service-Klasse für alle Document-CRUD Operationen
 */

import apiClient from './api.client';
import { API_CONFIG } from './api.config';
import {
  Document,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentFilters,
  DocumentListResponse,
  DocumentStats,
} from '../types/document';

/**
 * DocumentService Klasse
 * Zentrale Verwaltung aller Document-API-Calls
 */
class DocumentService {
  /**
   * Alle Dokumente abrufen
   * @param filters - Optional: Filter-Parameter
   * @returns Promise mit Dokumentenliste
   */
  async getAll(filters?: DocumentFilters): Promise<DocumentListResponse> {
  try {
    const response = await apiClient.get<{ success: boolean; data: Document[] }>(
      API_CONFIG.ENDPOINTS.DOCUMENTS,
      { params: filters }
    );
    
    // Backend gibt { success: true, data: [...] } zurück
    const documents = response.data.data || [];
    
    return {
      documents: documents,
      total: documents.length,
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

  /**
   * Einzelnes Dokument abrufen
   * @param id - Dokument ID
   * @returns Promise mit Dokument
   */
  async getById(id: string): Promise<Document> {
    try {
      const response = await apiClient.get<Document>(
        API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id)
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Neues Dokument erstellen
   * @param data - Dokument-Daten
   * @returns Promise mit erstelltem Dokument
   */
  async create(data: CreateDocumentDTO): Promise<Document> {
    try {
      const response = await apiClient.post<Document>(
        API_CONFIG.ENDPOINTS.DOCUMENTS,
        data
      );
      console.log('Document created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Dokument aktualisieren
   * @param id - Dokument ID
   * @param data - Zu aktualisierende Daten
   * @returns Promise mit aktualisiertem Dokument
   */
  async update(id: string, data: UpdateDocumentDTO): Promise<Document> {
    try {
      const response = await apiClient.put<Document>(
        API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id),
        data
      );
      console.log('Document updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Dokument löschen
   * @param id - Dokument ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.DOCUMENT_BY_ID(id));
      console.log(`Document ${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Dokument-Statistiken abrufen
   * @returns Promise mit Statistiken
   */
  async getStats(): Promise<DocumentStats> {
    try {
      const response = await apiClient.get<DocumentStats>(
        API_CONFIG.ENDPOINTS.DOCUMENT_STATS
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  /**
   * Dokumente nach Kategorie abrufen
   * @param category - Kategorie-Name
   * @returns Promise mit gefilterten Dokumenten
   */
  async getByCategory(category: string): Promise<DocumentListResponse> {
    return this.getAll({ category });
  }

  /**
   * Dokumente nach Tags abrufen
   * @param tags - Array von Tags
   * @returns Promise mit gefilterten Dokumenten
   */
  async getByTags(tags: string[]): Promise<DocumentListResponse> {
    return this.getAll({ tags });
  }

  /**
   * Dokumente suchen
   * @param searchTerm - Suchbegriff
   * @returns Promise mit Suchergebnissen
   */
  async search(searchTerm: string): Promise<DocumentListResponse> {
    return this.getAll({ searchTerm });
  }
}

// Singleton Instance exportieren
export const documentService = new DocumentService();
export default documentService;
