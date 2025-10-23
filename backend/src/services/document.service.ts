import { prisma } from '../config/database';
import { DocumentCategory } from '@prisma/client';

export class DocumentService {
  async createDocument(data: any) {
    return await prisma.document.create({
      data: {
        title: data.title,
        content: data.content || '',
        category: data.category,
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        status: data.status || 'DRAFT',
        priority: data.priority || 'MEDIUM'
      }
    });
  }

  async getAllDocuments() {
    const docs = await prisma.document.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(doc => ({
      ...doc,
      tags: JSON.parse(doc.tags)
    }));
  }

  async getDocumentById(id: number) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (doc) {
      return { ...doc, tags: JSON.parse(doc.tags) };
    }
    return null;
  }

  async getDocumentsByCategory(category: string) {
    const docs = await prisma.document.findMany({
      where: { category: category as DocumentCategory },
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(doc => ({
      ...doc,
      tags: JSON.parse(doc.tags)
    }));
  }

  async updateDocument(id: number, data: any) {
    return await prisma.document.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        version: { increment: 1 }
      }
    });
  }

  async deleteDocument(id: number) {
    return await prisma.document.delete({ where: { id } });
  }
}