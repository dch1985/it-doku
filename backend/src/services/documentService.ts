import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export class DocumentService {
  /**
   * Erstellt ein neues Dokument
   */
  async createDocument(data: CreateDocumentInput) {
    try {
      const document = await prisma.document.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category,
          templateId: data.templateId,
          status: data.status || 'draft',
        },
        include: {
          template: true,
        },
      });

      return document;
    } catch (error) {
      throw new Error(`Fehler beim Erstellen des Dokuments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gibt alle Dokumente zurück
   */
  async getAllDocuments(filters?: { category?: string; status?: string }) {
    try {
      const where: any = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const documents = await prisma.document.findMany({
        where,
        include: {
          template: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return documents;
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Dokumente: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gibt ein einzelnes Dokument zurück
   */
  async getDocumentById(id: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          template: true,
        },
      });

      if (!document) {
        throw new Error('Dokument nicht gefunden');
      }

      return document;
    } catch (error) {
      throw new Error(`Fehler beim Abrufen des Dokuments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Aktualisiert ein Dokument
   */
  async updateDocument(id: string, data: UpdateDocumentInput) {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          template: true,
        },
      });

      return document;
    } catch (error) {
      throw new Error(`Fehler beim Aktualisieren des Dokuments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Löscht ein Dokument
   */
  async deleteDocument(id: string) {
    try {
      await prisma.document.delete({
        where: { id },
      });

      return { success: true, message: 'Dokument erfolgreich gelöscht' };
    } catch (error) {
      throw new Error(`Fehler beim Löschen des Dokuments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gibt Statistiken über Dokumente zurück
   */
  async getDocumentStats() {
    try {
      const [total, byCategory, byStatus] = await Promise.all([
        prisma.document.count(),
        prisma.document.groupBy({
          by: ['category'],
          _count: true,
        }),
        prisma.document.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      return {
        total,
        byCategory: byCategory.reduce((acc: any, item: any) => {
          acc[item.category] = item._count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Statistiken: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const documentService = new DocumentService();
