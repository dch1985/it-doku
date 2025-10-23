const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface Document {
  id: string;
  templateId?: string;
  title: string;
  content: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template?: Template;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  content: string;
  category: string;
  templateId?: string;
  status?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  category?: string;
  status?: string;
}

export interface DocumentsResponse {
  success: boolean;
  count: number;
  documents: Document[];
}

export interface DocumentResponse {
  success: boolean;
  document: Document;
  message?: string;
}

export interface TemplatesResponse {
  success: boolean;
  count: number;
  templates: Template[];
}

export interface TemplateResponse {
  success: boolean;
  template: Template;
}

export class DocumentsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ========== Documents ==========

  /**
   * Alle Dokumente abrufen
   */
  async getAllDocuments(filters?: { category?: string; status?: string }): Promise<DocumentsResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);

    const url = `${this.baseUrl}/api/documents${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Dokumente');
    }

    return response.json();
  }

  /**
   * Einzelnes Dokument abrufen
   */
  async getDocumentById(id: string): Promise<DocumentResponse> {
    const response = await fetch(`${this.baseUrl}/api/documents/${id}`);

    if (!response.ok) {
      throw new Error('Dokument nicht gefunden');
    }

    return response.json();
  }

  /**
   * Neues Dokument erstellen
   */
  async createDocument(data: CreateDocumentInput): Promise<DocumentResponse> {
    const response = await fetch(`${this.baseUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen des Dokuments');
    }

    return response.json();
  }

  /**
   * Dokument aktualisieren
   */
  async updateDocument(id: string, data: UpdateDocumentInput): Promise<DocumentResponse> {
    const response = await fetch(`${this.baseUrl}/api/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Aktualisieren des Dokuments');
    }

    return response.json();
  }

  /**
   * Dokument löschen
   */
  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Löschen des Dokuments');
    }

    return response.json();
  }

  /**
   * Dokumenten-Statistiken abrufen
   */
  async getDocumentStats() {
    const response = await fetch(`${this.baseUrl}/api/documents/stats`);

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Statistiken');
    }

    return response.json();
  }

  // ========== Templates ==========

  /**
   * Alle Templates abrufen
   */
  async getAllTemplates(filters?: { category?: string; type?: string }): Promise<TemplatesResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);

    const url = `${this.baseUrl}/api/templates${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Templates');
    }

    return response.json();
  }

  /**
   * Einzelnes Template abrufen
   */
  async getTemplateById(id: string): Promise<TemplateResponse> {
    const response = await fetch(`${this.baseUrl}/api/templates/${id}`);

    if (!response.ok) {
      throw new Error('Template nicht gefunden');
    }

    return response.json();
  }

  /**
   * NIST-konforme Templates seeden
   */
  async seedTemplates() {
    const response = await fetch(`${this.baseUrl}/api/templates/seed`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Fehler beim Seeden der Templates');
    }

    return response.json();
  }
}

export const documentsAPI = new DocumentsAPI();
