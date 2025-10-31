/**
 * Document Type Definitions
 * TypeScript Interfaces für die IT-Dokumentation
 */

export interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  status?: DocumentStatus;
}

export interface CreateDocumentDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  author: string;
  status?: DocumentStatus;
}

export interface UpdateDocumentDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: DocumentStatus;
}

export interface DocumentFilters {
  category?: string;
  tags?: string[];
  author?: string;
  status?: DocumentStatus;
  searchTerm?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface DocumentStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<DocumentStatus, number>;
  recentDocuments: Document[];
}
