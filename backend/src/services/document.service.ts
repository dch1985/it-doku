import { prisma } from '../lib/prisma.js';
import { DocumentCategory } from '../types/enums.js';

export class DocumentService {
  async createDocument(data: any) {
    // userId ist required - temporär: ersten User finden oder erstellen
    let userId = data.userId;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        const demoUser = await prisma.user.create({
          data: {
            email: 'demo@it-doku.local',
            name: 'Demo User',
            role: 'ADMIN'
          }
        });
        userId = demoUser.id;
      } else {
        userId = firstUser.id;
      }
    }

    return await prisma.document.create({
      data: {
        title: data.title,
        content: data.content || '',
        category: data.category || 'DOCUMENTATION',
        tenantId: data.tenantId, // Required for multi-tenancy
        userId: userId, // Required im Schema
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        status: data.status || 'DRAFT'
        // priority entfernt - existiert nicht im Schema
      }
    });
  }

  async getAllDocuments() {
    const docs = await prisma.document.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(doc => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : []
    }));
  }

  async getDocumentById(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (doc) {
      return { ...doc, tags: doc.tags ? JSON.parse(doc.tags) : [] };
    }
    return null;
  }

  async getDocumentsByCategory(category: string) {
    const docs = await prisma.document.findMany({
      where: { category: category },
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(doc => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : []
    }));
  }

  async updateDocument(id: string, data: any) {
    return await prisma.document.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.tags && { tags: JSON.stringify(data.tags) }),
        version: { increment: 1 }
      }
    });
  }

  async deleteDocument(id: string) {
    return await prisma.document.delete({ where: { id } });
  }
}