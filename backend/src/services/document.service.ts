import { prisma } from '../config/database';

// Helper function to convert document to frontend format
function formatDocument(doc: any) {
  return {
    id: doc.id.toString(),
    title: doc.title,
    content: doc.content || '',
    category: doc.category,
    tags: Array.isArray(doc.tags) ? doc.tags : (typeof doc.tags === 'string' ? JSON.parse(doc.tags || '[]') : []),
    author: doc.author || 'System',
    status: doc.status.toLowerCase(),
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export class DocumentService {
  async createDocument(data: any) {
    const doc = await prisma.document.create({
      data: {
        title: data.title,
        content: data.content || '',
        category: data.category || 'General',
        tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : (data.tags || '[]'),
        author: data.author || 'System',
        status: (data.status || 'draft').toUpperCase(),
        priority: data.priority || 'MEDIUM'
      }
    });
    return formatDocument(doc);
  }

  async getAllDocuments() {
    const docs = await prisma.document.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(formatDocument);
  }

  async getDocumentById(id: number) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (doc) {
      return formatDocument(doc);
    }
    return null;
  }

  async getDocumentsByCategory(category: string) {
    const docs = await prisma.document.findMany({
      where: { category },
      orderBy: { updatedAt: 'desc' }
    });
    return docs.map(formatDocument);
  }

  async updateDocument(id: number, data: any) {
    const updateData: any = {
      version: { increment: 1 }
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.status !== undefined) updateData.status = data.status.toUpperCase();
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags;
    }

    const doc = await prisma.document.update({
      where: { id },
      data: updateData
    });
    return formatDocument(doc);
  }

  async deleteDocument(id: number) {
    await prisma.document.delete({ where: { id } });
    return true;
  }
}
